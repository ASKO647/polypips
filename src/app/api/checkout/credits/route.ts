import { getActivePaymentProvider } from "@/lib/payments/config";
import { createStripeCreditsCheckout } from "@/lib/payments/stripe/credits-checkout";
import { createWhopCreditsCheckout } from "@/lib/payments/whop/credits-checkout";

/** Provider-agnostic entry point for credit-pack purchases — see
 * /api/checkout/subscription/route.ts's identical reasoning. */
export async function POST(request: Request) {
  return getActivePaymentProvider() === "whop"
    ? createWhopCreditsCheckout(request)
    : createStripeCreditsCheckout(request);
}
