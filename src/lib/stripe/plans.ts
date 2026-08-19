export type PlanId = "decouverte" | "pro";
export type PayingPlanId = Exclude<PlanId, "decouverte">;

/**
 * Price ID for the single real recurring product, read from the
 * environment so switching between Stripe test and live mode (or rotating
 * the price itself) never requires a code change or redeploy — only a
 * different STRIPE_PRICE_ID_PRO value. The "decouverte" plan bills through
 * this exact same Pro price — its Checkout Session additionally attaches a
 * one-time 0,99€ line item and a 3-day trial (see /api/stripe/checkout),
 * so "decouverte" and "pro" are indistinguishable by price ID alone.
 * subscription_data.metadata.plan is what actually disambiguates them once
 * the subscription exists in Stripe.
 *
 * Lazily read (not module-level) so this file can be imported at build
 * time without the env var being set yet — same reasoning as getStripe()
 * in lib/stripe/server.ts. Throws only once something actually tries to
 * use the price, with a message that says exactly what's missing instead
 * of Stripe's own opaque "no such price" error.
 */
function proPriceId(): string {
  const id = process.env.STRIPE_PRICE_ID_PRO;
  if (!id) {
    throw new Error(
      "STRIPE_PRICE_ID_PRO is not set. Add it to your environment (the Stripe Price ID for the Pro product, in whichever mode — test or live — matches STRIPE_SECRET_KEY)."
    );
  }
  return id;
}

export const PLAN_PRICE_IDS: Record<PayingPlanId, string> = {
  get pro() {
    return proPriceId();
  },
};

/** Reverse lookup for webhook events that only carry a Stripe price id. */
export function planForPriceId(priceId: string): PayingPlanId | null {
  return priceId === PLAN_PRICE_IDS.pro ? "pro" : null;
}

export function isPlanId(value: string): value is PlanId {
  return value === "decouverte" || value === "pro";
}
