import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";
import { getPlanMeta } from "@/lib/data/pricing";
import { whopFetch } from "./client";
import { WHOP_PLAN_IDS, isWhopCheckoutPlanId, type WhopCheckoutPlanId } from "./plans";

function resolveLocale(value: unknown): string {
  return typeof value === "string" && routing.locales.includes(value as (typeof routing.locales)[number])
    ? value
    : routing.defaultLocale;
}

type WhopPlanObject = {
  id: string;
  renewal_price?: number;
  initial_price?: number;
  currency?: string;
};

type WhopCheckoutConfiguration = {
  id: string;
  purchase_url: string;
};

/**
 * Server-side price integrity check, matching this task's "vérifie que le
 * montant... correspond au plan attendu" rule applied at checkout time
 * (not just at webhook time): the Whop plan object configured by the
 * owner (via WHOP_PLAN_ID_* env vars — see plans.ts) is the one and only
 * source of the price actually charged, but src/lib/data/pricing.ts is
 * supposed to be the single source of truth for what that price SHOULD
 * be. If the owner edits pricing.ts without updating the matching Whop
 * plan (or vice versa), this refuses the checkout instead of silently
 * charging a stale amount. EUR is assumed (see the delivery report's
 * currency note) — refused if the plan's own currency isn't "eur".
 */
async function assertWhopPlanMatchesPricing(whopPlanId: string, expectedPlan: WhopCheckoutPlanId): Promise<void> {
  const plan = await whopFetch<WhopPlanObject>(`/plans/${whopPlanId}`);
  const expectedRenewalEur = expectedPlan === "decouverte" ? getPlanMeta("pro").priceEur : getPlanMeta(expectedPlan).priceEur;

  if (plan.currency && plan.currency.toLowerCase() !== "eur") {
    throw new Error(
      `Whop plan ${whopPlanId} currency is "${plan.currency}", expected "eur" — refusing checkout.`
    );
  }
  if (typeof plan.renewal_price === "number" && Math.abs(plan.renewal_price - expectedRenewalEur) > 0.01) {
    throw new Error(
      `Whop plan ${whopPlanId} renewal_price (${plan.renewal_price}) does not match pricing.ts's ${expectedPlan} price (${expectedRenewalEur}) — refusing checkout. Update the Whop plan or pricing.ts so they agree.`
    );
  }
  if (expectedPlan === "decouverte") {
    const expectedInitialEur = getPlanMeta("decouverte").priceEur;
    if (typeof plan.initial_price === "number" && Math.abs(plan.initial_price - expectedInitialEur) > 0.01) {
      throw new Error(
        `Whop plan ${whopPlanId} initial_price (${plan.initial_price}) does not match pricing.ts's decouverte price (${expectedInitialEur}) — refusing checkout. Update the Whop plan or pricing.ts so they agree.`
      );
    }
  }
}

/**
 * Whop equivalent of createStripeSubscriptionCheckout — same
 * anti-recreation/discovery-offer rules, applied against the
 * provider-agnostic `subscriptions` row (provider column distinguishes
 * Stripe from Whop rows, but "has this user ever subscribed before"
 * means any row at all, regardless of which provider it came from).
 *
 * Plan change while already subscribed: Whop's REST API has no documented
 * prorated in-place plan change (see the delivery report's doc-gap note
 * for §2e) — the simplest honest behavior per the task's own instruction
 * is applied here: the current membership is cancelled IMMEDIATELY (no
 * refund, no credit for time remaining) and a brand-new checkout for the
 * target plan is created at its full price, starting today. The frontend
 * must disclose this before the user confirms (see subscription-plans.tsx
 * / subscription-tab.tsx's updated notice copy).
 */
export async function createWhopSubscriptionCheckout(request: Request): Promise<Response> {
  let body: { plan?: string; locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const locale = resolveLocale(body.locale);
  const t = await getTranslations({ locale, namespace: "StripeCheckout" });

  if (!body.plan || !isWhopCheckoutPlanId(body.plan)) {
    return NextResponse.json(
      { error: "invalid_input", message: t("errors.unknown_plan") },
      { status: 400 }
    );
  }
  const plan: WhopCheckoutPlanId = body.plan;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json(
      { error: "unauthorized", message: t("errors.unauthorized") },
      { status: 401 }
    );
  }

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("plan, status, cancel_at_period_end, whop_membership_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const hasSubscribedBefore = existing !== null;
  const hasActiveAccessNow =
    existing !== null &&
    (existing.status === "active" || existing.status === "trialing") &&
    !existing.cancel_at_period_end;

  // Same one-shot rule as Stripe: once a user has ever had a subscription,
  // "decouverte" can no longer be requested — force to "pro" instead.
  // Computed BEFORE the already-on-plan/cancellation checks below so both
  // compare against this resolved plan, never the raw client-requested
  // one — comparing against the raw `plan` there would let a client who
  // (mistakenly or not) re-sends "decouverte" while already subscribed
  // skip the cancel-before-switch step entirely and end up with two live
  // memberships once the new checkout completes.
  const effectivePlan: WhopCheckoutPlanId = hasSubscribedBefore && plan === "decouverte" ? "pro" : plan;

  if (hasActiveAccessNow && existing!.plan === effectivePlan) {
    return NextResponse.json(
      { error: "already_on_plan", message: t("errors.already_on_plan") },
      { status: 409 }
    );
  }

  // Plan change while subscribed: cancel the current membership immediately
  // (see this function's own doc comment above for why — no documented
  // Whop proration) before creating the new checkout below.
  if (hasActiveAccessNow && existing!.plan !== effectivePlan && existing!.whop_membership_id) {
    try {
      await whopFetch(`/memberships/${existing!.whop_membership_id}/cancel`, {
        method: "POST",
        body: { cancellation_mode: "immediate" },
      });
    } catch (error) {
      console.error("[whop/checkout] failed to cancel membership before plan change", error);
      return NextResponse.json(
        { error: "whop_error", message: t("errors.stripe_error") },
        { status: 502 }
      );
    }
  }

  let whopPlanId: string;
  try {
    whopPlanId = WHOP_PLAN_IDS[effectivePlan];
    await assertWhopPlanMatchesPricing(whopPlanId, effectivePlan);
  } catch (error) {
    console.error("[whop/checkout] plan configuration error", error);
    return NextResponse.json(
      { error: "whop_error", message: t("errors.stripe_error") },
      { status: 502 }
    );
  }

  const origin = new URL(request.url).origin;

  try {
    const checkout = await whopFetch<WhopCheckoutConfiguration>("/checkout_configurations", {
      method: "POST",
      body: {
        plan_id: whopPlanId,
        // Never create a new plan here — the plan (with its price points)
        // is pre-configured once by the owner and referenced by id (see
        // plans.ts), never built ad hoc from a client-influenced amount.
        force_create_new_plan: false,
        redirect_url: `${origin}/${locale}/dashboard/settings?checkout=pending&provider=whop`,
        metadata: { supabase_user_id: user.id, type: "subscription", plan: effectivePlan },
      },
    });

    return NextResponse.json({ url: checkout.purchase_url });
  } catch (error) {
    console.error("[whop/checkout] failed to create checkout configuration", error);
    return NextResponse.json(
      { error: "whop_error", message: t("errors.stripe_error") },
      { status: 502 }
    );
  }
}
