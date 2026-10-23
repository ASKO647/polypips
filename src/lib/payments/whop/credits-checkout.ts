import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";
import { CREDIT_PACKS, isCreditPackId } from "@/lib/stripe/credit-packs";
import { whopFetch } from "./client";

function resolveLocale(value: unknown): string {
  return typeof value === "string" && routing.locales.includes(value as (typeof routing.locales)[number])
    ? value
    : routing.defaultLocale;
}

type WhopCheckoutConfiguration = {
  id: string;
  purchase_url: string;
};

/**
 * Whop equivalent of createStripeCreditsCheckout. Packs are one-time
 * purchases with a price that rarely changes, so — mirroring Stripe's own
 * inline price_data technique rather than Stripe's reusable Price
 * objects — this builds the plan inline on every call
 * (force_create_new_plan:true) straight from CREDIT_PACKS
 * (src/lib/stripe/credit-packs.ts, the single source of truth shared with
 * the Stripe implementation), never a client-supplied amount. No env var
 * / pre-created plan needed for packs, unlike subscriptions (see
 * plans.ts) — there's nothing to "reuse" for a one-time amount that can
 * change the moment the owner edits CREDIT_PACKS.
 */
export async function createWhopCreditsCheckout(request: Request): Promise<Response> {
  let body: { pack?: string; locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const locale = resolveLocale(body.locale);
  const t = await getTranslations({ locale, namespace: "Credits" });

  if (!body.pack || !isCreditPackId(body.pack)) {
    return NextResponse.json(
      { error: "invalid_input", message: t("errors.unknownPack") },
      { status: 400 }
    );
  }
  const pack = CREDIT_PACKS[body.pack];

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

  const origin = new URL(request.url).origin;

  try {
    const checkout = await whopFetch<WhopCheckoutConfiguration>("/checkout_configurations", {
      method: "POST",
      body: {
        force_create_new_plan: true,
        plan: {
          plan_type: "one_time",
          initial_price: pack.priceCents / 100,
          currency: "eur",
        },
        redirect_url: `${origin}/${locale}/dashboard/credits?purchase=pending&provider=whop`,
        metadata: {
          supabase_user_id: user.id,
          type: "credits",
          pack: pack.id,
          credits: String(pack.credits),
        },
      },
    });

    return NextResponse.json({ url: checkout.purchase_url });
  } catch (error) {
    console.error("[whop/credits-checkout] failed to create session", error);
    return NextResponse.json(
      { error: "whop_error", message: t("errors.stripeError") },
      { status: 502 }
    );
  }
}
