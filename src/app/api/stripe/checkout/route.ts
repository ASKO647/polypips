import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { isPlanId, PLAN_PRICE_IDS, type PlanId } from "@/lib/stripe/plans";
import { createClient } from "@/lib/supabase/server";

/** 0,99 € — the "decouverte" plan's upfront charge, in cents. Not a Stripe
 * Price object: created inline per session via price_data since it's a
 * one-off amount, not a reusable product. */
const DISCOVERY_UPFRONT_AMOUNT_CENTS = 99;

/**
 * Stripe's hosted Checkout page auto-generates its own "X days free" /
 * "free trial" copy the moment subscription_data.trial_period_days is set —
 * there is no Checkout Session parameter to reword or remove that specific
 * badge, even though a real 0,99 € invoice_item is being charged in the
 * same session (confirmed against Stripe's Checkout docs: trial_period_days
 * only controls the trial's length, and neither the Price/Product nor
 * subscription_data expose a "trial label" override). custom_text.submit
 * is the actual supported lever — it renders right next to the Pay button
 * on the Checkout page itself, which is the one place a customer's eye
 * lands right before paying, so it's used here instead of only adding more
 * text upstream on the Polypips site (the pricing card already does that
 * too — see components/marketing/pricing.tsx). Markdown bold/links only,
 * 1200 char max.
 */
const DISCOVERY_SUBMIT_MESSAGE =
  "**0,99 € facturés aujourd'hui** pour votre période découverte de 3 jours — ce n'est pas un essai gratuit. Puis 29,99 €/mois, résiliable à tout moment avant la fin des 3 jours pour ne rien payer de plus.";

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
        { price: PLAN_PRICE_IDS.pro, quantity: 1 },
        ...(plan === "decouverte"
          ? [
              {
                price_data: {
                  currency: "eur",
                  unit_amount: DISCOVERY_UPFRONT_AMOUNT_CENTS,
                  product_data: {
                    name: "Polypips — Période découverte (3 jours)",
                    description:
                      "Accès complet à Polypips pendant 3 jours, facturé 0,99 € dès aujourd'hui. Puis 29,99 €/mois, sauf annulation avant la fin des 3 jours.",
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
      ...(plan === "decouverte"
        ? { custom_text: { submit: { message: DISCOVERY_SUBMIT_MESSAGE } } }
        : {}),
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
