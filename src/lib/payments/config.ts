/**
 * Single switch between the two payment providers. Stripe stays the
 * default so nothing changes until this is explicitly flipped — set
 * PAYMENT_PROVIDER=whop (Vercel env) to route every checkout/cancel/
 * webhook call through src/lib/payments/whop/* instead of
 * src/lib/payments/stripe/*. Both implementations keep running side by
 * side; switching back to "stripe" (or just unsetting the var) is a
 * config change, not a code change — see the delivery report for the
 * exact rollback steps.
 */
export type PaymentProviderId = "stripe" | "whop";

export function getActivePaymentProvider(): PaymentProviderId {
  return process.env.PAYMENT_PROVIDER === "whop" ? "whop" : "stripe";
}
