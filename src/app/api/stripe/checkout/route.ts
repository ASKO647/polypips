import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { isPlanId, priceIdForPlan, type PlanId } from "@/lib/stripe/plans";
import { createClient } from "@/lib/supabase/server";

/** 0,99 € — the "decouverte" plan's upfront charge, in cents. Not a Stripe
 * Price object: created inline per session via price_data since it's a
 * one-off amount, not a reusable product. */
const DISCOVERY_UPFRONT_AMOUNT_CENTS = 99;

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

  if (!body.plan || !isPlanId(body.plan)) {
    return NextResponse.json(
      { error: "invalid_input", message: "Plan inconnu." },
      { status: 400 }
    );
  }
  const plan: PlanId = body.plan;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json(
      { error: "unauthorized", message: "Connectez-vous pour continuer." },
      { status: 401 }
    );
  }

  // Reuse the Stripe customer if this user already has one (e.g. they
  // cancelled and are resubscribing) instead of creating a duplicate.
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const existingCustomerId = existing?.stripe_customer_id as string | null | undefined;

  const origin = new URL(request.url).origin;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        { price: priceIdForPlan(plan), quantity: 1 },
        ...(plan === "decouverte"
          ? [
              {
                price_data: {
                  currency: "eur",
                  unit_amount: DISCOVERY_UPFRONT_AMOUNT_CENTS,
                  product_data: {
                    name: "Polypips — Offre découverte (premier paiement)",
                  },
                },
                quantity: 1,
              },
            ]
          : []),
      ],
      subscription_data: {
        ...(plan === "decouverte" ? { trial_period_days: 3 } : {}),
        metadata: { supabase_user_id: user.id, plan },
      },
      client_reference_id: user.id,
      ...(existingCustomerId
        ? { customer: existingCustomerId }
        : { customer_email: user.email }),
      success_url: `${origin}/dashboard/settings?checkout=success`,
      cancel_url: `${origin}/#tarifs?checkout=cancelled`,
    });

    if (!session.url) {
      throw new Error("Checkout session created without a redirect URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe/checkout] failed to create session", error);
    return NextResponse.json(
      {
        error: "stripe_error",
        message: "Impossible de démarrer le paiement. Réessayez.",
      },
      { status: 502 }
    );
  }
}
