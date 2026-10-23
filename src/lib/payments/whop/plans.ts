import type { PlanId } from "@/lib/stripe/plans";

/** The plans a user may actually request through the Whop checkout route.
 * Unlike Stripe (where "decouverte" and "pro" share one Price object,
 * disambiguated only by subscription metadata — see lib/stripe/plans.ts),
 * Whop's plan object directly encodes initial_price/renewal_price/
 * trial_period_days, so "decouverte" needs its OWN Whop plan, distinct
 * from "pro"'s. "pro_legacy" stays excluded — never checkout-selectable,
 * assigned only by the one-time legacy-migration script. */
export type WhopCheckoutPlanId = "decouverte" | "pro" | "pro_plus" | "ultimate";

const WHOP_PLAN_ENV_VARS: Record<WhopCheckoutPlanId, string> = {
  decouverte: "WHOP_PLAN_ID_DECOUVERTE",
  pro: "WHOP_PLAN_ID_PRO",
  pro_plus: "WHOP_PLAN_ID_PRO_PLUS",
  ultimate: "WHOP_PLAN_ID_ULTIMATE",
};

/**
 * Whop plan id for each of the 4 checkout-selectable plans, read from the
 * environment exactly like PLAN_PRICE_IDS in lib/stripe/plans.ts — each
 * plan must be created once by hand (dashboard or
 * POST /checkout_configurations with force_create_new_plan:true) in both
 * the sandbox and production Whop accounts, then its plan_* id pasted
 * into the matching env var. Lazily read so this module can be imported
 * at build time without every var being set yet.
 */
function whopPlanIdFor(plan: WhopCheckoutPlanId): string {
  const envVar = WHOP_PLAN_ENV_VARS[plan];
  const id = process.env[envVar];
  if (!id) {
    throw new Error(
      `${envVar} is not set. Create the matching plan on Whop (dashboard or API) and paste its plan_... id into this env var.`
    );
  }
  return id;
}

export const WHOP_PLAN_IDS: Record<WhopCheckoutPlanId, string> = {
  get decouverte() {
    return whopPlanIdFor("decouverte");
  },
  get pro() {
    return whopPlanIdFor("pro");
  },
  get pro_plus() {
    return whopPlanIdFor("pro_plus");
  },
  get ultimate() {
    return whopPlanIdFor("ultimate");
  },
};

/** Reverse lookup for the webhook — a membership only carries its own
 * whop_plan_id, never our internal PlanId, so this is how we recover
 * "which of our plans does this membership correspond to" when metadata
 * is missing or unreadable. Each comparison is wrapped so a
 * not-yet-configured plan id never throws here. */
export function planForWhopPlanId(whopPlanId: string): PlanId | null {
  for (const plan of ["decouverte", "pro", "pro_plus", "ultimate"] as const) {
    try {
      if (whopPlanId === WHOP_PLAN_IDS[plan]) return plan;
    } catch {
      // Plan id not configured yet — not a match.
    }
  }
  return null;
}

export function isWhopCheckoutPlanId(value: string): value is WhopCheckoutPlanId {
  return value === "decouverte" || value === "pro" || value === "pro_plus" || value === "ultimate";
}
