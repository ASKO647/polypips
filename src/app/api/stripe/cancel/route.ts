import { cancelStripeSubscription } from "@/lib/payments/stripe/cancel";

/** Stripe-specific entry point, kept working exactly as before. The
 * frontend now calls the provider-agnostic /api/checkout/cancel instead
 * — see src/lib/payments/config.ts. */
export async function POST() {
  return cancelStripeSubscription();
}
