import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { MONTHLY_AI_BUDGET_EUR_BY_PLAN } from "./plan-quotas.ts";

/**
 * Per-customer monthly AI spend cap (margin protection) and the
 * platform-wide hard cap on automated-scan spend. Both read real spend
 * from ai_usage_events (never trust a client-supplied value) and are
 * meant to be checked server-side, right before starting an AI call that
 * would count against them.
 */

/** Same rough peg as src/lib/data/pricing.ts's USD_PER_EUR — duplicated
 * here for the same Deno-can't-import-Next.js-tree reason as
 * plan-quotas.ts. Keep in sync by hand. */
const USD_PER_EUR = 1.08;

function serviceRoleClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type BillingCycle = { start: string; end: string };

/**
 * This user's current billing-cycle window, anchored to their real Stripe
 * subscription (subscriptions.current_period_end), same convention
 * already used for wallet/credit quota cycles elsewhere in this codebase
 * (src/lib/supabase/quota-cycles.ts, sync_plan_credits_cycle). Returns
 * null when there's no real period to anchor to (no subscription, or a
 * lapsed/cancelled one) — callers should skip the monthly-spend-cap check
 * entirely in that case, exactly like those other quota-cycle checks do;
 * the daily analysis-count cap still applies regardless via
 * FREE_DEMO_DAILY_LIMIT.
 */
export async function getCurrentBillingCycle(
  supabase: SupabaseClient,
  userId: string
): Promise<BillingCycle | null> {
  const { data } = await supabase
    .from("subscriptions")
    .select("current_period_end, status, cancel_at_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  const periodEnd = data?.current_period_end as string | null | undefined;
  const hasActiveAccess = data?.status === "active" || data?.status === "trialing";
  if (!periodEnd || !hasActiveAccess) {
    return null;
  }

  const end = new Date(periodEnd);
  const start = new Date(end);
  start.setUTCMonth(start.getUTCMonth() - 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * Whether consuming one Deep Analysis credit right now would draw from
 * this user's plan-included pool (user_credits.plan_credits_balance,
 * reset each cycle — see sync_plan_credits_cycle in the credits-system
 * migrations) or from a purchased/referral/welcome credit instead.
 * Included consumptions count toward the monthly spend cap below
 * (already paid for by the subscription price, which the cap protects
 * the margin of); purchased-pack consumptions never do (the user already
 * paid separately for that AI cost, on top of their subscription).
 *
 * Calls sync_plan_credits_cycle first (service_role RPC, idempotent
 * within a cycle) so a just-renewed subscription's fresh grant is always
 * reflected, even if the user never opened /dashboard/credits since
 * renewing.
 */
export async function wouldConsumeIncludedCredit(userId: string): Promise<boolean> {
  const supabase = serviceRoleClient();
  const { error: syncError } = await supabase.rpc("sync_plan_credits_cycle", { p_user_id: userId });
  if (syncError) {
    console.error("[ai-budget] sync_plan_credits_cycle failed", syncError);
  }
  const { data } = await supabase
    .from("user_credits")
    .select("plan_credits_balance")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.plan_credits_balance ?? 0) > 0;
}

export type SpendCapResult = {
  exceeded: boolean;
  spentUsd: number;
  budgetUsd: number | null;
  cycleEnd: string | null;
};

/**
 * The actual margin-protection gate: sums this user's real AI cost
 * (ai_usage_events.cost_usd) over their current billing cycle, counting
 * ONLY standard analyses and deep analyses paid with INCLUDED credits
 * (credit_source in ('none', 'included')) — a deep analysis paid with a
 * purchased pack never counts, since that AI cost was already paid for
 * separately. Compares against this plan's MONTHLY_AI_BUDGET_EUR_BY_PLAN
 * entry, converted to USD. Returns exceeded=false (never blocks) when
 * the plan has no budget configured (decouverte) or the user has no real
 * billing cycle to check against — same "nothing to anchor to, so don't
 * lock" convention as getCurrentBillingCycle/quota-cycles.ts.
 */
export async function checkMonthlySpendCap(
  supabase: SupabaseClient,
  userId: string,
  plan: string
): Promise<SpendCapResult> {
  const budgetEur = MONTHLY_AI_BUDGET_EUR_BY_PLAN[plan] ?? null;
  if (budgetEur === null) {
    return { exceeded: false, spentUsd: 0, budgetUsd: null, cycleEnd: null };
  }

  const cycle = await getCurrentBillingCycle(supabase, userId);
  if (!cycle) {
    return { exceeded: false, spentUsd: 0, budgetUsd: budgetEur * USD_PER_EUR, cycleEnd: null };
  }

  const admin = serviceRoleClient();
  const { data, error } = await admin
    .from("ai_usage_events")
    .select("cost_usd")
    .eq("user_id", userId)
    .in("credit_source", ["none", "included"])
    .gte("created_at", cycle.start)
    .lt("created_at", cycle.end);

  if (error) {
    console.error("[ai-budget] failed to read ai_usage_events for spend-cap check", error);
    // Fail OPEN on a read error (don't block a paying user over an
    // observability glitch) — the hard global cap and manual monitoring
    // via the owner console remain the backstop.
    return { exceeded: false, spentUsd: 0, budgetUsd: budgetEur * USD_PER_EUR, cycleEnd: cycle.end };
  }

  const spentUsd = (data ?? []).reduce((sum, row) => sum + Number(row.cost_usd ?? 0), 0);
  const budgetUsd = budgetEur * USD_PER_EUR;
  return { exceeded: spentUsd >= budgetUsd, spentUsd, budgetUsd, cycleEnd: cycle.end };
}

/** Shared across analyze-market/analyze-sport-match/analyze-trading-chart
 * so the wording is identical everywhere. French-only, same as every
 * other quota-exceeded message already in these Edge Functions (e.g.
 * "limit_reached") — this codebase has no mechanism today for an Edge
 * Function to know the caller's locale (no header/param carries it
 * anywhere in the existing analyze-* request flow), so a bilingual
 * server-side message would be new scope beyond what the existing
 * pattern supports. Flagged in the delivery report. */
export function formatMonthlyBudgetMessage(cycleEnd: string): string {
  const renewsAt = new Date(cycleEnd).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `Limite d'usage du mois atteinte. Vos analyses reprennent à votre prochain renouvellement le ${renewsAt}. Vous pouvez aussi utiliser des crédits Analyse Approfondie.`;
}

/**
 * Platform-wide safety net, independent of any one customer's budget:
 * total AI spend across every user AND every automated scan this
 * CALENDAR month (not per-user billing cycles — this is a blunt global
 * backstop, not a per-customer margin check). scan-markets,
 * scan-sport-matches and scan-trading-pairs call this before their first
 * AI call each run and skip the run entirely if it's already exceeded —
 * "je suis prévenu dans la console owner" is implemented as a clear,
 * always-live alert on the owner console's Coûts IA section (computed
 * from the same ai_usage_events data on every page load), since this
 * codebase has no outbound email/SMS/Slack integration to page the owner
 * through instead.
 */
export async function checkGlobalMonthlyHardCap(): Promise<{ exceeded: boolean; spentUsd: number; capUsd: number }> {
  const capEur = Number(Deno.env.get("AI_MONTHLY_HARD_CAP_EUR") ?? "100");
  const capUsd = capEur * USD_PER_EUR;

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const supabase = serviceRoleClient();
  const { data, error } = await supabase
    .from("ai_usage_events")
    .select("cost_usd")
    .gte("created_at", monthStart);

  if (error) {
    console.error("[ai-budget] failed to read ai_usage_events for global hard cap", error);
    return { exceeded: false, spentUsd: 0, capUsd };
  }

  const spentUsd = (data ?? []).reduce((sum, row) => sum + Number(row.cost_usd ?? 0), 0);
  return { exceeded: spentUsd >= capUsd, spentUsd, capUsd };
}
