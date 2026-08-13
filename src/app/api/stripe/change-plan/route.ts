import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { priceIdForPlan, type PayingPlanId } from "@/lib/stripe/plans";
import { createClient } from "@/lib/supabase/server";

function isPayingPlanId(value: string): value is PayingPlanId {
  return value === "pro" || value === "pro-plus";
}

/**
 * Upgrade/downgrade between Pro and Pro+. The "decouverte" offer is
 * signup-only (it's what starts a subscription, not something you switch
 * into later), so this route only accepts the two direct paying plans.
 * Stripe prorates the difference by default (proration_behavior:
 * "create_prorations").
 */
export async function POST(request: Request) {
  let body: { plan?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_input", message: "Corps de requête JSON invalide." },
      { status: 400 }
    );
  }

  if (!body.plan || !isPayingPlanId(body.plan)) {
    return NextResponse.json(
      { error: "invalid_input", message: "Plan inconnu." },
      { status: 400 }
    );
  }
  const plan = body.plan;

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
    .select("stripe_subscription_id, plan")
    .eq("user_id", user.id)
    .maybeSingle();

  const subscriptionId = subscription?.stripe_subscription_id as string | null | undefined;
  if (!subscriptionId) {
    return NextResponse.json(
      { error: "no_subscription", message: "Aucun abonnement actif à modifier." },
      { status: 400 }
    );
  }

  if (subscription?.plan === plan) {
    return NextResponse.json(
      { error: "same_plan", message: "Vous êtes déjà sur ce plan." },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();
    const current = await stripe.subscriptions.retrieve(subscriptionId);
    const itemId = current.items.data[0]?.id;
    if (!itemId) {
      throw new Error("Subscription has no billable item to update.");
    }

    await stripe.subscriptions.update(subscriptionId, {
      items: [{ id: itemId, price: priceIdForPlan(plan) }],
      proration_behavior: "create_prorations",
      metadata: { ...current.metadata, plan },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[stripe/change-plan] failed", error);
    return NextResponse.json(
      { error: "stripe_error", message: "Le changement de plan a échoué. Réessayez." },
      { status: 502 }
    );
  }
}
