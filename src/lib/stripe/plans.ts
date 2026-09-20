export type PlanId = "decouverte" | "pro" | "pro_plus" | "ultimate" | "pro_legacy";

/** The 3 real recurring products a user can actually pick at checkout.
 * "decouverte" goes through its own special-cased checkout flow (see
 * /api/stripe/checkout) rather than being chosen directly, and
 * "pro_legacy" is never checkout-selectable at all — it's assigned only by
 * the one-time legacy-migration script, to subscribers who were already on
 * the old unlimited Pro plan before this 3-tier structure existed. */
export type PayingPlanId = "pro" | "pro_plus" | "ultimate";

const PLAN_ENV_VARS: Record<PayingPlanId, string> = {
  pro: "STRIPE_PRICE_ID_PRO",
  pro_plus: "STRIPE_PRICE_ID_PRO_PLUS",
  ultimate: "STRIPE_PRICE_ID_ULTIMATE",
};

/**
 * Price ID for each of the 3 real recurring products, read from the
 * environment so switching between Stripe test and live mode (or rotating
 * a price itself) never requires a code change or redeploy. The
 * "decouverte" plan bills through the exact same Pro price as "pro" — its
 * Checkout Session additionally attaches a one-time 0,99€ line item and a
 * 3-day trial (see /api/stripe/checkout), so "decouverte" and "pro" are
 * indistinguishable by price ID alone. subscription_data.metadata.plan is
 * what actually disambiguates them once the subscription exists in
 * Stripe — same reasoning extends to "pro_legacy", which also shares the
 * Pro price ID and is disambiguated purely by metadata.
 *
 * Lazily read (not module-level) so this file can be imported at build
 * time without every env var being set yet — e.g. Pro+ and Ultimate's
 * price IDs may not exist yet if those Stripe products haven't been
 * created. Throws only once something actually tries to use a given
 * price, with a message that says exactly what's missing instead of
 * Stripe's own opaque "no such price" error.
 */
function priceIdFor(plan: PayingPlanId): string {
  const envVar = PLAN_ENV_VARS[plan];
  const id = process.env[envVar];
  if (!id) {
    throw new Error(
      `${envVar} is not set. Add it to your environment (the Stripe Price ID for the ${plan} product, in whichever mode — test or live — matches STRIPE_SECRET_KEY).`
    );
  }
  return id;
}

export const PLAN_PRICE_IDS: Record<PayingPlanId, string> = {
  get pro() {
    return priceIdFor("pro");
  },
  get pro_plus() {
    return priceIdFor("pro_plus");
  },
  get ultimate() {
    return priceIdFor("ultimate");
  },
};

/** Reverse lookup for webhook events that only carry a Stripe price id.
 * Each comparison is wrapped so a not-yet-configured price (e.g. Pro+ or
 * Ultimate before their env vars are set) never throws here — it's simply
 * skipped, same as any other non-match. */
export function planForPriceId(priceId: string): PayingPlanId | null {
  for (const plan of ["pro", "pro_plus", "ultimate"] as const) {
    try {
      if (priceId === PLAN_PRICE_IDS[plan]) return plan;
    } catch {
      // Price id not configured for this plan yet — not a match.
    }
  }
  return null;
}

export function isPlanId(value: string): value is PlanId {
  return (
    value === "decouverte" ||
    value === "pro" ||
    value === "pro_plus" ||
    value === "ultimate" ||
    value === "pro_legacy"
  );
}

/** The plans a user may actually request at checkout (POST body `plan`) —
 * "pro_legacy" is deliberately excluded, it can never be chosen by a
 * client. "decouverte" is included since it still goes through this same
 * route with its own special-cased pricing (see /api/stripe/checkout). */
export function isCheckoutPlanId(
  value: string
): value is "decouverte" | PayingPlanId {
  return (
    value === "decouverte" || value === "pro" || value === "pro_plus" || value === "ultimate"
  );
}
