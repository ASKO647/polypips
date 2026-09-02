/**
 * Plan display copy (name/tagline/price/features/cta) lives in the "plans"
 * message namespace (messages/{locale}/plans.json), never as hardcoded
 * strings here — getPricingPlans(t) merges it with the plan metadata below
 * at render time. `t` must be scoped to the "Plans" namespace, e.g.
 * `useTranslations("Plans")` (client) or `getTranslations("Plans")`
 * (server).
 *
 * Quota numbers (dailyAnalysisLimit etc.) used to be regex-parsed out of
 * the French feature label strings — that broke the instant those labels
 * became translatable, since the regex only matched French phrasing. They
 * are now plain numeric fields on PLAN_METADATA, decoupled from display
 * copy in either language.
 */

export type PlanId = "decouverte" | "pro";

export type PlanMeta = {
  id: PlanId;
  priceEur: number;
  hasCountdown?: boolean;
  highlighted?: boolean;
  dailyAnalysisLimit: number | null;
  weeklyCoachMessageLimit: number | null;
  maxTrackedWallets: number | null;
};

/** Both current plans are unlimited on every quota — these fields exist so
 * a future numeric cap never has to go back through display-text parsing
 * again, not because a limit exists today. */
export const PLAN_METADATA: PlanMeta[] = [
  {
    id: "decouverte",
    priceEur: 0.99,
    hasCountdown: true,
    highlighted: true,
    dailyAnalysisLimit: null,
    weeklyCoachMessageLimit: null,
    maxTrackedWallets: null,
  },
  {
    id: "pro",
    priceEur: 29.99,
    dailyAnalysisLimit: null,
    weeklyCoachMessageLimit: null,
    maxTrackedWallets: null,
  },
];

export function getPlanMeta(id: string): PlanMeta {
  return PLAN_METADATA.find((p) => p.id === id) ?? PLAN_METADATA[0];
}

export type PricingPlan = PlanMeta & {
  name: string;
  tagline: string;
  price: string;
  priceSuffix: string;
  afterOffer?: string;
  originalPrice?: string;
  features: string[];
  cta: string;
};

type PlansTranslator = {
  (key: string): string;
  raw: (key: string) => unknown;
};

/** Builds the locale-aware plan list — call with a translator scoped to
 * the "Plans" namespace so every plan's copy renders in the current
 * locale. Never import a static plan array directly; call this at render
 * time in every component/page that needs plan display copy. */
export function getPricingPlans(t: PlansTranslator): PricingPlan[] {
  return PLAN_METADATA.map((meta) => ({
    ...meta,
    name: t(`${meta.id}.name`),
    tagline: t(`${meta.id}.tagline`),
    price: t(`${meta.id}.price`),
    priceSuffix: t(`${meta.id}.priceSuffix`),
    afterOffer: meta.id === "decouverte" ? t(`${meta.id}.afterOffer`) : undefined,
    originalPrice: meta.id === "pro" ? t(`${meta.id}.originalPrice`) : undefined,
    features: t.raw(`${meta.id}.features`) as string[],
    cta: t(`${meta.id}.cta`),
  }));
}

export function getDailyAnalysisLimit(plan: PlanMeta): number | null {
  return plan.dailyAnalysisLimit;
}

export function getWeeklyCoachMessageLimit(plan: PlanMeta): number | null {
  return plan.weeklyCoachMessageLimit;
}

/**
 * "3 portefeuilles suivis par mois" is a locked monthly quota, not a
 * freely-swappable concurrent cap: once a user has followed N wallets in
 * the current billing cycle, they can't unfollow one to follow a
 * different one until the subscription renews (see
 * lib/supabase/quota-cycles.ts). Returns null when unlimited.
 */
export function getMaxTrackedWallets(plan: PlanMeta): number | null {
  return plan.maxTrackedWallets;
}
