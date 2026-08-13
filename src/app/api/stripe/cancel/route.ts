import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Schedules cancellation at the end of the current billing period — the
 * user keeps access (and doesn't get refunded) until then, matching what
 * they already paid for. The `subscriptions` row itself is only ever
 * updated by the webhook once Stripe confirms the change.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "Connectez-vous pour continuer." },
      { status: 401 }
    );
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const subscriptionId = subscription?.stripe_subscription_id as string | null | undefined;
  if (!subscriptionId) {
    return NextResponse.json(
      { error: "no_subscription", message: "Aucun abonnement actif à annuler." },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[stripe/cancel] failed", error);
    return NextResponse.json(
      { error: "stripe_error", message: "L'annulation a échoué. Réessayez." },
      { status: 502 }
    );
  }
}
