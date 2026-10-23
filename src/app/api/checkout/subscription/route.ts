import { getActivePaymentProvider } from "@/lib/payments/config";
import { createStripeSubscriptionCheckout } from "@/lib/payments/stripe/subscription-checkout";
import { createWhopSubscriptionCheckout } from "@/lib/payments/whop/subscription-checkout";

/**
 * Provider-agnostic entry point the frontend calls from now on — picks
 * Stripe or Whop based on PAYMENT_PROVIDER (src/lib/payments/config.ts)
 * without any business logic living in this file itself. The old
 * /api/stripe/checkout keeps working unchanged for any direct caller.
 */
export async function POST(request: Request) {
  return getActivePaymentProvider() === "whop"
    ? createWhopSubscriptionCheckout(request)
    : createStripeSubscriptionCheckout(request);
}
