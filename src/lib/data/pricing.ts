/**
 * Plan display copy (name/tagline/price/features/cta) lives in the "plans"
 * message namespace (messages/{locale}/plans.json), never as hardcoded
 * strings here — getPricingPlans(t) merges it with the plan metadata below
 * at render time. `t` must be scoped to the "Plans" namespace, e.g.
 * `useTranslations("Plans")` (client) or `getTranslations("Plans")`
 * (server).
 *
 * Quota numbers (dailyAnalysisLimit etc.) are plain numeric/boolean fields
 * on PLAN_METADATA, decoupled from display copy in either language — the
 * single source of truth every gating check (server routes, Edge
 * Functions, client blur components) reads from, via getPlanMeta().
 */

export type PlanId = "decouverte" | "pro" | "pro_plus" | "ultimate" | "pro_legacy";

export type PlanMeta = {
  id: PlanId;
  priceEur: number;
  hasCountdown?: boolean;
  highlighted?: boolean;
  /** null = unlimited. The discovery offer and Pro share the same numeric
   * quotas (the offer explicitly grants Pro-tier access, never Pro+/
   * Ultimate) — Pro+, Ultimate and the legacy grandfather plan are
   * unlimited on every one of these. */
  dailyAnalysisLimit: number | null;
  weeklyCoachMessageLimit: number | null;
  maxTrackedWallets: number | null;
  /** Deep Analysis credits granted each billing cycle on top of this
   * plan's price — reset (not accumulated) on renewal, separate from any
   * permanently-owned purchased-pack balance. 0 for plans with no included
   * credits (they can still buy packs). */
  includedDeepAnalysisCredits: number;
  /** Manual "scan now" trigger on the 3 "Sélectionnés" pages (Polymarket
   * Marchés, Sport, Trading), instead of waiting for the next automatic
   * cron run. */
  onDemandScan: boolean;
  /** Visibility of the MoonX read-only connection entry point in Profil
   * ("Mes outils connectés") — currently a "Bientôt disponible" placeholder
   * for every plan that has it, see components/dashboard/settings/profile-tab.tsx. */
  moonxAccess: boolean;
  /** "Ultimate" badge shown next to the user's name in Communauté. */
  ultimateBadge: boolean;
  /** Automatic AI-generated weekly report — placeholder feature, see
   * profile-tab.tsx. */
  weeklyAiReport: boolean;
  /** Multi-platform trading connections beyond MoonX — placeholder
   * feature, see profile-tab.tsx. */
  multiPlatformTrading: boolean;
};

export const PLAN_METADATA: PlanMeta[] = [
  {
    id: "decouverte",
    priceEur: 0.99,
    hasCountdown: true,
    highlighted: false,
    dailyAnalysisLimit: 10,
    weeklyCoachMessageLimit: 20,
    maxTrackedWallets: 3,
    includedDeepAnalysisCredits: 0,
    onDemandScan: false,
    moonxAccess: false,
    ultimateBadge: false,
    weeklyAiReport: false,
    multiPlatformTrading: false,
  },
  {
    id: "pro",
    priceEur: 29.99,
    dailyAnalysisLimit: 10,
    weeklyCoachMessageLimit: 20,
    maxTrackedWallets: 3,
    includedDeepAnalysisCredits: 0,
    onDemandScan: false,
    moonxAccess: false,
    ultimateBadge: false,
    weeklyAiReport: false,
    multiPlatformTrading: false,
  },
  {
    id: "pro_plus",
    priceEur: 49.99,
    highlighted: true,
    dailyAnalysisLimit: null,
    weeklyCoachMessageLimit: null,
    maxTrackedWallets: 15,
    includedDeepAnalysisCredits: 15,
    onDemandScan: true,
    moonxAccess: true,
    ultimateBadge: false,
    weeklyAiReport: false,
    multiPlatformTrading: false,
  },
  {
    id: "ultimate",
    priceEur: 79.99,
    dailyAnalysisLimit: null,
    weeklyCoachMessageLimit: null,
    maxTrackedWallets: null,
    includedDeepAnalysisCredits: 50,
    onDemandScan: true,
    moonxAccess: true,
    ultimateBadge: true,
    weeklyAiReport: true,
    multiPlatformTrading: true,
  },
  // Not a purchasable/displayed plan — excluded from getPricingPlans()
  // below. Assigned only by the one-time legacy-migration script to
  // subscribers who were already on the old unlimited Pro plan before this
  // 3-tier structure existed; they keep every quota unlimited (mirroring
  // the old plan's behavior) for as long as they stay continuously
  // subscribed, but don't retroactively get Pro+/Ultimate-only features
  // that didn't exist under their old plan (included credits, MoonX,
  // weekly report, multi-platform, Ultimate badge) unless they explicitly
  // upgrade.
  {
    id: "pro_legacy",
    priceEur: 29.99,
    dailyAnalysisLimit: null,
    weeklyCoachMessageLimit: null,
    maxTrackedWallets: null,
    includedDeepAnalysisCredits: 0,
    onDemandScan: true,
    moonxAccess: false,
    ultimateBadge: false,
    weeklyAiReport: false,
    multiPlatformTrading: false,
  },
];

/** Plan ids ever displayed in real pricing UI (marketing /pricing,
 * dashboard SubscriptionPlans) — "pro_legacy" is a purely internal
 * entitlement, never shown as a plan someone can pick or currently be
 * "on" in that UI. */
const DISPLAYED_PLAN_IDS: PlanId[] = ["decouverte", "pro", "pro_plus", "ultimate"];

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
 * time in every component/page that needs plan display copy. Excludes
 * "pro_legacy" (see DISPLAYED_PLAN_IDS above) — use getPlanDisplay() for a
 * single plan id that might be "pro_legacy" (e.g. showing a legacy
 * subscriber their own current plan). */
export function getPricingPlans(t: PlansTranslator): PricingPlan[] {
  return PLAN_METADATA.filter((meta) => DISPLAYED_PLAN_IDS.includes(meta.id)).map((meta) =>
    buildPricingPlan(t, meta)
  );
}

function buildPricingPlan(t: PlansTranslator, meta: PlanMeta): PricingPlan {
  return {
    ...meta,
    name: t(`${meta.id}.name`),
    tagline: t(`${meta.id}.tagline`),
    price: t(`${meta.id}.price`),
    priceSuffix: t(`${meta.id}.priceSuffix`),
    afterOffer: meta.id === "decouverte" ? t(`${meta.id}.afterOffer`) : undefined,
    features: t.raw(`${meta.id}.features`) as string[],
    cta: t(`${meta.id}.cta`),
  };
}

/** Display copy for a single plan id, including "pro_legacy" — unlike
 * getPricingPlans(), never filtered, so callers that need to show a
 * specific user's actual current plan (which might be the internal-only
 * legacy entitlement) always get a real name/tagline/features back
 * instead of silently falling back to a different plan. Falls back to
 * "decouverte" only for a genuinely unknown id. */
export function getPlanDisplay(t: PlansTranslator, planId: string): PricingPlan {
  const meta = getPlanMeta(planId);
  return buildPricingPlan(t, meta);
}

export function getDailyAnalysisLimit(plan: PlanMeta): number | null {
  return plan.dailyAnalysisLimit;
}

export function getWeeklyCoachMessageLimit(plan: PlanMeta): number | null {
  return plan.weeklyCoachMessageLimit;
}

/**
 * "N portefeuilles suivis" is a locked monthly quota, not a
 * freely-swappable concurrent cap: once a user has followed N wallets in
 * the current billing cycle, they can't unfollow one to follow a
 * different one until the subscription renews (see
 * lib/supabase/quota-cycles.ts). Returns null when unlimited.
 */
export function getMaxTrackedWallets(plan: PlanMeta): number | null {
  return plan.maxTrackedWallets;
}
