import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getStripe } from "@/lib/stripe/server";
import { CREDIT_PACKS, isCreditPackId } from "@/lib/stripe/credit-packs";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";

/** Same reasoning as /api/stripe/checkout: this route lives outside
 * [locale], so the caller passes its own current locale explicitly. */
function resolveLocale(value: unknown): string {
  return typeof value === "string" && routing.locales.includes(value as (typeof routing.locales)[number])
    ? value
    : routing.defaultLocale;
}

export async function POST(request: Request) {
  let body: { pack?: string; locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const locale = resolveLocale(body.locale);
  const t = await getTranslations({ locale, namespace: "Credits" });

  if (!body.pack || !isCreditPackId(body.pack)) {
    return NextResponse.json(
      { error: "invalid_input", message: t("errors.unknownPack") },
      { status: 400 }
    );
  }
  const pack = CREDIT_PACKS[body.pack];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json(
      { error: "unauthorized", message: t("errors.unauthorized") },
      { status: 401 }
    );
  }

  const stripe = getStripe();
  const origin = new URL(request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: pack.priceCents,
            product_data: {
              name: t(`packs.${pack.id}.name`),
              description: t("checkoutLineDescription", { credits: pack.credits }),
            },
          },
          quantity: 1,
        },
      ],
      // Read back by the webhook to tell a credits purchase apart from a
      // subscription Checkout Session (which has no "type" metadata) and
      // to know exactly how many credits to grant — never re-derive the
      // amount from the charged total, which would silently break the
      // moment a promo/coupon is ever applied.
      metadata: { type: "credits", supabase_user_id: user.id, pack: pack.id, credits: String(pack.credits) },
      client_reference_id: user.id,
      customer_email: user.email,
      success_url: `${origin}/${locale}/dashboard/credits?purchase=success`,
      cancel_url: `${origin}/${locale}/dashboard/credits?purchase=cancelled`,
    });

    if (!session.url) {
      throw new Error("Checkout session created without a redirect URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe/credits-checkout] failed to create session", error);
    return NextResponse.json(
      { error: "stripe_error", message: t("errors.stripeError") },
      { status: 502 }
    );
  }
}
