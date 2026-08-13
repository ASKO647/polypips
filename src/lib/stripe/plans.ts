export type PlanId = "decouverte" | "pro" | "pro-plus";
export type PayingPlanId = Exclude<PlanId, "decouverte">;

/**
 * Stripe test-mode Price IDs for the two real recurring products. The
 * "decouverte" plan bills through the same Pro price — its Checkout Session
 * additionally attaches a one-time 0,99€ line item and a 3-day trial (see
 * /api/stripe/checkout), so "decouverte" and "pro" are indistinguishable by
 * price ID alone. subscription_data.metadata.plan is what actually
 * disambiguates them once the subscription exists in Stripe.
 */
export const PLAN_PRICE_IDS: Record<PayingPlanId, string> = {
  pro: "price_1U3iv0B1QpJLI8VQpQbROXPX",
  "pro-plus": "price_1U3ivVB1QpJLI8VQpu7Wag0E",
};

export function priceIdForPlan(plan: PlanId): string {
  return plan === "decouverte" ? PLAN_PRICE_IDS.pro : PLAN_PRICE_IDS[plan];
}

/** Reverse lookup for webhook events that only carry a Stripe price id. */
export function planForPriceId(priceId: string): PayingPlanId | null {
  if (priceId === PLAN_PRICE_IDS.pro) return "pro";
  if (priceId === PLAN_PRICE_IDS["pro-plus"]) return "pro-plus";
  return null;
}

export function isPlanId(value: string): value is PlanId {
  return value === "decouverte" || value === "pro" || value === "pro-plus";
}
