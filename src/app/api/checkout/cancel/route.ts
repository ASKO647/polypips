import { getActivePaymentProvider } from "@/lib/payments/config";
import { cancelStripeSubscription } from "@/lib/payments/stripe/cancel";
import { cancelWhopSubscription } from "@/lib/payments/whop/cancel";

/** Provider-agnostic entry point for subscription cancellation — see
 * /api/checkout/subscription/route.ts's identical reasoning. */
export async function POST() {
  return getActivePaymentProvider() === "whop"
    ? cancelWhopSubscription()
    : cancelStripeSubscription();
}
