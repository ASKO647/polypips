import { createStripeCreditsCheckout } from "@/lib/payments/stripe/credits-checkout";

/** Stripe-specific entry point, kept working exactly as before. The
 * frontend now calls the provider-agnostic /api/checkout/credits instead
 * — see src/lib/payments/config.ts. */
export async function POST(request: Request) {
  return createStripeCreditsCheckout(request);
}
