import { createStripeSubscriptionCheckout } from "@/lib/payments/stripe/subscription-checkout";

/** Stripe-specific entry point, kept working exactly as before for any
 * existing bookmark/integration. The frontend itself now calls the
 * provider-agnostic /api/checkout/subscription instead — see
 * src/lib/payments/config.ts. All real logic lives in
 * createStripeSubscriptionCheckout so neither route duplicates it. */
export async function POST(request: Request) {
  return createStripeSubscriptionCheckout(request);
}
