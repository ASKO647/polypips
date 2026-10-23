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

/**
 * Margin protection — SINGLE SOURCE OF TRUTH for every euro-denominated
 * constant the server uses to keep at least 65% margin per paying
 * customer (margin = (price - Stripe fee - AI cost) / price), from day
 * one of a subscription until cancellation. Every number here is
 * server-enforced (Edge Functions, this file's own consumers) — never
 * trust a client-supplied value for any of these. Change the numbers
 * here; nothing else should hardcode them.
 *
 * supabase/functions/_shared/plan-quotas.ts duplicates the
 * daily-analysis-limit numbers (Deno Edge Functions can't import this
 * Next.js file) and supabase/functions/_shared/ai-budget.ts duplicates
 * MONTHLY_AI_BUDGET_EUR_BY_PLAN for the same reason — keep both in sync
 * by hand with PLAN_METADATA below.
 */

/** Signup no longer grants any free Deep Analysis credits — set to 0 here
 * (was 15). The `ensure_welcome_credits()` Postgres function still runs
 * once per new user (idempotent "welcome" transaction, now granting this
 * amount) so existing call sites and the credit-history UI keep working;
 * it just no longer moves the balance. Existing users' balances are never
 * touched by this change. See the migration that lowered the DB-side
 * grant: supabase/migrations/20261022100000_defer_referral_bonus_and_zero_welcome_credits.sql */
export const WELCOME_CREDITS = 0;

/** Referral bonuses — granted ONLY on the referred user's first real
 * payment (never at signup), atomically with each other, server-side and
 * idempotently. See the same migration as WELCOME_CREDITS above:
 * record_user_referral() now only records the relationship at signup (no
 * credit), and record_user_referral_conversion() (called from the Stripe
 * webhook's checkout.session.completed handler) grants both of these at
 * once, once, the moment that payment clears. */
export const REFERRAL_REFERRED_USER_BONUS_CREDITS = 5;
export const REFERRAL_REFERRER_BONUS_CREDITS = 10;

/**
 * Maximum AI cost (USD actually spent with Anthropic, converted at
 * USD_PER_EUR below for the comparison) Polypips can spend per paying
 * customer per billing cycle while still keeping >= 65% margin on that
 * customer's subscription price, after an estimated Stripe fee — see
 * STRIPE_FEE_ESTIMATE below. Confirmed numbers (includes a safety
 * margin beyond the bare 65% floor):
 *   Pro      29,99 € -> 9,00 €
 *   Pro+     49,99 € -> 15,00 €
 *   Ultimate 79,99 € -> 24,00 €
 * "pro_legacre" is priced identically to Pro (29,99 €) so it gets the same
 * 9,00 € budget — not given an explicit number in the spec; flagged in
 * the delivery report as a choice to confirm. "decouverte" (1,00 € / 3
 * days) has no explicit budget either: its own 3/day cap already bounds
 * its AI cost to a few cents for the whole trial (see the report), so no
 * monthly spend-cap check is wired for it — only the daily-count cap
 * applies, same mechanism as before. null here means "no monthly
 * spend-cap check for this plan" (decouverte only).
 */
export const MONTHLY_AI_BUDGET_EUR_BY_PLAN: Record<PlanId, number | null> = {
  decouverte: null,
  pro: 9.0,
  pro_plus: 15.0,
  ultimate: 24.0,
  pro_legacy: 9.0,
};

/** Rough, conservative USD/EUR peg for comparing AI spend (billed in USD
 * by Anthropic) against the EUR budgets above — intentionally simple
 * rather than a live FX feed, since the ~35% safety margin already baked
 * into the budgets above absorbs ordinary FX drift. Revisit if EUR/USD
 * moves far from parity for an extended period. */
export const USD_PER_EUR = 1.08;

/**
 * Stripe's processing fee is an ESTIMATE (not fetched from Stripe), used
 * only to display an indicative margin % in the owner console — the
 * actual rate depends on the owner's real Stripe pricing/negotiated
 * volume/card origin and was not verifiable from this environment
 * (network access to stripe.com is not available here). This is the
 * commonly published Stripe EU standard card rate; CONFIRM against the
 * owner's actual Stripe account and adjust here if different — nothing
 * else in the margin-protection logic (the hard per-plan AI budgets
 * above) depends on this being exact, only the console's displayed %.
 */
export const STRIPE_FEE_PERCENT = 0.015;
export const STRIPE_FEE_FIXED_EUR = 0.25;

/** Server-side-enforced monthly platform-wide AI spend ceiling (USD) —
 * once total Anthropic spend across ALL users and automated scans this
 * calendar month crosses this, scan-markets/scan-sport-matches/
 * scan-trading-pairs stop calling the AI for the rest of the month and
 * the owner console shows a clear alert. Read from the environment so it
 * can be raised/lowered without a redeploy; 100 is the documented
 * fallback default when the env var isn't set. Must be set identically
 * (or left at the same default) in both the Next.js app (Vercel) and
 * every Supabase Edge Function's environment — see the delivery report
 * for the exact env var name, AI_MONTHLY_HARD_CAP_EUR. */
export const DEFAULT_AI_MONTHLY_HARD_CAP_EUR = 100;

export type PlanMeta = {
  id: PlanId;
  priceEur: number;
  hasCountdown?: boolean;
  highlighted?: boolean;
  /** Daily cap on standard (non-"deep") AI analyses, combined across
   * Polymarket/Sport/Trading — see countCombinedDailyAnalyses. null would
   * mean unlimited; no current plan uses that anymore (even Pro+/Ultimate
   * now have a real, generous cap — see MONTHLY_AI_BUDGET_EUR_BY_PLAN's
   * comment for why "unlimited" isn't compatible with a guaranteed
   * margin). */
  dailyAnalysisLimit: number | null;
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
  /** "Ultimate" badge shown next to the user's name. */
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
    priceEur: 1.0,
    hasCountdown: true,
    highlighted: false,
    dailyAnalysisLimit: 3,
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
    dailyAnalysisLimit: 40,
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
    dailyAnalysisLimit: 80,
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
    dailyAnalysisLimit: 40,
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
