export type PlanId = "decouverte" | "pro";
export type PayingPlanId = Exclude<PlanId, "decouverte">;

/**
 * Stripe test-mode Price ID for the single real recurring product. The
 * "decouverte" plan bills through the same Pro price — its Checkout Session
 * additionally attaches a one-time 0,99€ line item and a 3-day trial (see
 * /api/stripe/checkout), so "decouverte" and "pro" are indistinguishable by
 * price ID alone. subscription_data.metadata.plan is what actually
 * disambiguates them once the subscription exists in Stripe.
 */
export const PLAN_PRICE_IDS: Record<PayingPlanId, string> = {
  pro: "price_1U3iv0B1QpJLI8VQpQbROXPX",
};

/** Reverse lookup for webhook events that only carry a Stripe price id. */
export function planForPriceId(priceId: string): PayingPlanId | null {
  return priceId === PLAN_PRICE_IDS.pro ? "pro" : null;
}

export function isPlanId(value: string): value is PlanId {
  return value === "decouverte" || value === "pro";
}
