import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractWhopWebhookHeaders, verifyWhopWebhookSignature } from "@/lib/payments/whop/webhook-verify";
import { whopFetch } from "@/lib/payments/whop/client";
import { getPlanMeta } from "@/lib/data/pricing";
import { isPlanId, type PlanId } from "@/lib/stripe/plans";
import { CREDIT_PACKS, isCreditPackId } from "@/lib/stripe/credit-packs";
import { recordInfluencerConversion } from "@/lib/supabase/influencer-commissions";
import { recordUserReferralConversion } from "@/lib/supabase/user-referrals";

/**
 * Whop's Standard Webhooks payload shapes are only partially confirmed
 * from this environment (docs.whop.com itself is unreachable here — see
 * the delivery report). Every field read below is accessed defensively
 * (optional chaining, multiple candidate names tried in order) and every
 * handler is best-effort: a shape mismatch is logged loudly and the
 * event is skipped rather than throwing and losing the whole delivery,
 * UNLESS the mismatch is in a field this file's own financial checks
 * depend on (user id, amount, currency), in which case it refuses to
 * grant anything — see each handler's own comments for exactly which is
 * which.
 */

type WhopPayment = {
  id?: string;
  currency?: string;
  final_amount?: number;
  total?: number;
  amount?: number;
  amount_after_fees?: number;
  metadata?: Record<string, unknown>;
  membership?: { id?: string; user_id?: string; member?: { id?: string }; user?: { id?: string } };
  plan?: { id?: string };
};

type WhopPlanDetail = {
  id: string;
  renewal_price?: number;
  initial_price?: number;
  currency?: string;
  billing_period?: number;
  trial_period_days?: number;
};

type WhopWebhookEvent = { type: string; data: Record<string, unknown> };

/** Reads whichever "amount the customer actually paid" field is present
 * — in that preference order, since amount_after_fees is net of Whop's
 * own cut and would make the integrity check below reject a perfectly
 * valid payment. Logs once if it had to fall back to amount_after_fees
 * (the least accurate option) so this is visible in production logs if
 * the preferred fields turn out not to exist. */
function extractPaidAmountEur(payment: WhopPayment): number | null {
  if (typeof payment.final_amount === "number") return payment.final_amount;
  if (typeof payment.total === "number") return payment.total;
  if (typeof payment.amount === "number") return payment.amount;
  if (typeof payment.amount_after_fees === "number") {
    console.warn("[whop/webhook] falling back to amount_after_fees for the paid-amount check");
    return payment.amount_after_fees;
  }
  return null;
}

function amountMatches(paidEur: number | null, expectedEur: number): boolean {
  return paidEur !== null && Math.abs(paidEur - expectedEur) <= 0.01;
}

async function handleCreditsPaymentSucceeded(
  supabase: SupabaseClient,
  payment: WhopPayment
): Promise<void> {
  const meta = payment.metadata ?? {};
  const userId = meta.supabase_user_id as string | undefined;
  const packId = meta.pack as string | undefined;
  const credits = Number(meta.credits);
  const paymentId = payment.id;

  if (!userId || !packId || !isCreditPackId(packId) || !Number.isFinite(credits) || credits <= 0 || !paymentId) {
    console.error("[whop/webhook] credits payment.succeeded missing/invalid metadata", {
      hasUserId: !!userId,
      packId,
      credits: meta.credits,
      hasPaymentId: !!paymentId,
    });
    return;
  }

  const pack = CREDIT_PACKS[packId];
  const paidEur = extractPaidAmountEur(payment);
  const expectedEur = pack.priceCents / 100;
  const currency = (payment.currency ?? "eur").toLowerCase();

  if (currency !== "eur" || !amountMatches(paidEur, expectedEur)) {
    console.error(
      `[whop/webhook] credits payment amount/currency mismatch — refusing to grant. paid=${paidEur} ${currency}, expected=${expectedEur} eur, pack=${packId}`
    );
    return;
  }

  const { error } = await supabase.rpc("credit_purchase", {
    p_user_id: userId,
    p_amount: credits,
    p_whop_payment_id: paymentId,
  });
  if (error) {
    console.error("[whop/webhook] credit_purchase RPC failed", error);
  }
}

async function handleSubscriptionPaymentSucceeded(
  supabase: SupabaseClient,
  payment: WhopPayment
): Promise<void> {
  const meta = payment.metadata ?? {};
  const userId = meta.supabase_user_id as string | undefined;
  const metaPlan = meta.plan as string | undefined;
  const membershipId = payment.membership?.id;

  if (!userId || !metaPlan || !isPlanId(metaPlan) || !membershipId) {
    console.error("[whop/webhook] subscription payment.succeeded missing/invalid data", {
      hasUserId: !!userId,
      metaPlan,
      hasMembershipId: !!membershipId,
    });
    return;
  }
  const plan: PlanId = metaPlan;

  const { data: existingRow } = await supabase
    .from("subscriptions")
    .select("id, plan")
    .eq("whop_membership_id", membershipId)
    .maybeSingle();
  const isFirstPayment = !existingRow;

  // decouverte's own two price points: 1,00€ for the very first payment,
  // then the full Pro price for every renewal after the trial window —
  // same two-price shape Stripe implements with trial_period_days + a
  // separate one-off line item (see
  // src/lib/payments/stripe/subscription-checkout.ts), modeled here
  // directly through the Whop plan's own initial_price/renewal_price.
  const expectedPlanForPrice: PlanId = plan === "decouverte" && !isFirstPayment ? "pro" : plan;
  const expectedEur = getPlanMeta(expectedPlanForPrice).priceEur;

  const paidEur = extractPaidAmountEur(payment);
  const currency = (payment.currency ?? "eur").toLowerCase();
  if (currency !== "eur" || !amountMatches(paidEur, expectedEur)) {
    console.error(
      `[whop/webhook] subscription payment amount/currency mismatch — refusing to grant access. paid=${paidEur} ${currency}, expected=${expectedEur} eur, plan=${plan}, membership=${membershipId}`
    );
    return;
  }

  // The plan's own billing_period/trial_period_days decide how far out
  // the next renewal sits — re-fetched here rather than cached anywhere,
  // since this is the one authoritative source for those numbers (see
  // plans.ts's own comment on why a Whop plan's price/period fields, not
  // this webhook payload, are the source of truth). The resulting
  // current_period_end is therefore an approximation (now + N days), not
  // a value read directly off a confirmed Whop "period end" field — no
  // such field could be confirmed from this environment's documentation
  // access. Flagged in the delivery report.
  const whopPlanId = payment.plan?.id;
  let periodDays = 30;
  try {
    if (whopPlanId) {
      const planDetail = await whopFetch<WhopPlanDetail>(`/plans/${whopPlanId}`);
      periodDays =
        plan === "decouverte" && isFirstPayment
          ? planDetail.trial_period_days ?? 3
          : planDetail.billing_period ?? 30;
    }
  } catch (error) {
    console.error("[whop/webhook] failed to read plan billing_period, defaulting to 30 days", error);
  }
  const currentPeriodEndIso = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString();

  // Conversion mirrors the Stripe webhook's handleSubscriptionUpdated:
  // the first renewal payment after a decouverte trial is what actually
  // flips the stored plan to "pro" and stamps converted_from_trial/
  // converted_at — never done at the initial 1,00€ payment itself.
  const wasDecouverteTrial = existingRow?.plan === "decouverte";
  const justConverted = !isFirstPayment && wasDecouverteTrial && plan === "decouverte";
  const resolvedPlan: PlanId = justConverted ? "pro" : plan === "decouverte" && !isFirstPayment ? "pro" : plan;
  const status = plan === "decouverte" && isFirstPayment ? "trialing" : "active";

  const { error: upsertError } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      provider: "whop",
      whop_membership_id: membershipId,
      whop_plan_id: whopPlanId ?? null,
      whop_member_id:
        payment.membership?.user_id ?? payment.membership?.member?.id ?? payment.membership?.user?.id ?? null,
      plan: resolvedPlan,
      status,
      current_period_end: currentPeriodEndIso,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
      ...(justConverted ? { converted_from_trial: true, converted_at: new Date().toISOString() } : {}),
    },
    { onConflict: "user_id" }
  );
  if (upsertError) {
    console.error("[whop/webhook] subscriptions upsert failed", upsertError);
    return;
  }

  if (isFirstPayment) {
    const paidCents = paidEur !== null ? Math.round(paidEur * 100) : null;
    await recordInfluencerConversion(supabase, userId, paidCents);
    await recordUserReferralConversion(supabase, userId);
  }
}

async function handlePaymentSucceeded(supabase: SupabaseClient, payment: WhopPayment): Promise<void> {
  if (payment.metadata?.type === "credits") {
    await handleCreditsPaymentSucceeded(supabase, payment);
  } else {
    await handleSubscriptionPaymentSucceeded(supabase, payment);
  }
}

async function handlePaymentFailed(supabase: SupabaseClient, payment: WhopPayment): Promise<void> {
  const membershipId = payment.membership?.id;
  if (!membershipId) return; // not tied to a membership we can update

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("whop_membership_id", membershipId);
  if (error) {
    console.error("[whop/webhook] payment.failed update failed", error);
  }
}

/** membership.deactivated / membership.went_invalid — both names appear
 * across conflicting Whop doc pages (see the delivery report's §2g
 * note); handled identically on purpose rather than guessing which one
 * is actually live for this account. */
async function handleMembershipDeactivated(supabase: SupabaseClient, data: Record<string, unknown>): Promise<void> {
  const membershipId = (data.id as string | undefined) ?? (data.membership_id as string | undefined);
  if (!membershipId) return;

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "canceled", cancel_at_period_end: false, updated_at: new Date().toISOString() })
    .eq("whop_membership_id", membershipId);
  if (error) {
    console.error("[whop/webhook] membership deactivation update failed", error);
  }
}

/** membership.activated / membership.updated / membership.went_valid /
 * membership.cancel_at_period_end_changed — re-reads the live membership
 * via GET rather than trusting this event's own payload shape (the one
 * place this webhook follows the "always re-read current state" rule
 * from the delivery report, since these event names/fields are the least
 * consistently documented of all of them). A no-op if we have no row for
 * this membership yet — payment.succeeded is what creates the row in the
 * first place, so there's nothing to update here before that happens. */
async function handleMembershipUpsert(supabase: SupabaseClient, data: Record<string, unknown>): Promise<void> {
  const membershipId = (data.id as string | undefined) ?? (data.membership_id as string | undefined);
  if (!membershipId) return;

  const { data: existingRow } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("whop_membership_id", membershipId)
    .maybeSingle();
  if (!existingRow) return;

  type WhopMembershipDetail = { status?: string; cancel_at_period_end?: boolean };
  let membership: WhopMembershipDetail;
  try {
    membership = await whopFetch<WhopMembershipDetail>(`/memberships/${membershipId}`);
  } catch (error) {
    console.error("[whop/webhook] failed to re-read membership for upsert", error);
    return;
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof membership.cancel_at_period_end === "boolean") {
    update.cancel_at_period_end = membership.cancel_at_period_end;
  }
  if (membership.status === "trialing" || membership.status === "active" || membership.status === "past_due") {
    update.status = membership.status;
  } else if (membership.status === "canceled" || membership.status === "expired" || membership.status === "inactive") {
    update.status = "canceled";
  }

  const { error } = await supabase.from("subscriptions").update(update).eq("whop_membership_id", membershipId);
  if (error) {
    console.error("[whop/webhook] membership upsert update failed", error);
  }
}

/**
 * refund.created — "la règle la plus prudente" per the task: a refund
 * never auto-revokes access or deletes anything here. The event is
 * already durably recorded (the dedup insert in POST below stores the
 * full raw payload in whop_webhook_events), which is what the owner
 * console's "Coûts IA"-style Paiements section reads — this handler's
 * only extra job is a loud server log so it's visible outside the
 * console too.
 */
async function handleRefundCreated(data: Record<string, unknown>): Promise<void> {
  console.warn("[whop/webhook] refund.created received — review in the owner console", {
    refundId: data.id,
  });
}

/** dispute.created — "alerte owner et marque le compte, sans
 * suppression": sets subscriptions.disputed = true (surfaced in the
 * owner console) if the membership can be resolved from the payload;
 * never changes access or deletes anything either way. */
async function handleDisputeCreated(supabase: SupabaseClient, data: Record<string, unknown>): Promise<void> {
  const payment = data.payment as WhopPayment | undefined;
  const membershipId = payment?.membership?.id;
  console.warn("[whop/webhook] dispute.created received — review in the owner console", {
    disputeId: data.id,
    membershipId,
  });
  if (!membershipId) return;

  const { error } = await supabase
    .from("subscriptions")
    .update({ disputed: true, updated_at: new Date().toISOString() })
    .eq("whop_membership_id", membershipId);
  if (error) {
    console.error("[whop/webhook] failed to flag disputed subscription", error);
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const headers = extractWhopWebhookHeaders(request.headers);

  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[whop/webhook] WHOP_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  if (!verifyWhopWebhookSignature(rawBody, headers, secret)) {
    console.error("[whop/webhook] signature verification failed");
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  let event: WhopWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Dedup by webhook-id: on conflict (already recorded), the upsert
  // ignores the write and returns no row — that's the idempotent-no-op
  // signal below. A failure to even perform this check returns 500 (not
  // 200) so Whop retries later, rather than risking either silently
  // dropping a real event or double-processing one we're not sure we
  // already recorded.
  const { data: dedupRows, error: dedupError } = await supabase
    .from("whop_webhook_events")
    .upsert(
      { webhook_id: headers.id!, type: event.type, payload: event },
      { onConflict: "webhook_id", ignoreDuplicates: true }
    )
    .select("webhook_id");

  if (dedupError) {
    console.error("[whop/webhook] failed to record webhook event for dedup", dedupError);
    return NextResponse.json({ error: "temporary_failure" }, { status: 500 });
  }
  if (!dedupRows || dedupRows.length === 0) {
    // Already processed this exact webhook-id.
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "payment.succeeded":
        await handlePaymentSucceeded(supabase, event.data as WhopPayment);
        break;
      case "payment.failed":
        await handlePaymentFailed(supabase, event.data as WhopPayment);
        break;
      case "membership.activated":
      case "membership.updated":
      case "membership.went_valid":
      case "membership.cancel_at_period_end_changed":
        await handleMembershipUpsert(supabase, event.data);
        break;
      case "membership.deactivated":
      case "membership.went_invalid":
        await handleMembershipDeactivated(supabase, event.data);
        break;
      case "refund.created":
        await handleRefundCreated(event.data);
        break;
      case "dispute.created":
        await handleDisputeCreated(supabase, event.data);
        break;
      default:
        // Every other event type (including any this file didn't
        // anticipate) is intentionally ignored, not an error — same
        // posture as the Stripe webhook's own default case.
        break;
    }
  } catch (error) {
    console.error(`[whop/webhook] failed to handle ${event.type}`, error);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
