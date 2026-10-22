import { createAdminClient } from "@/lib/supabase/admin";
import {
  STRIPE_FEE_PERCENT,
  STRIPE_FEE_FIXED_EUR,
  USD_PER_EUR,
  DEFAULT_AI_MONTHLY_HARD_CAP_EUR,
  getPlanMeta,
  type PlanId,
} from "@/lib/data/pricing";

type UsageRow = {
  user_id: string | null;
  kind: "standard" | "deep" | "scan" | "image_extraction";
  cost_usd: number;
  credit_source: "included" | "purchased" | "none";
};

function monthStartIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export type OwnerAiCostsSummary = {
  hasData: boolean;
  totalCostUsdThisMonth: number;
  avgCostByKind: Record<"standard" | "deep" | "scan", number | null>;
  scanCostUsdThisMonth: number;
  hardCapEur: number;
  hardCapExceeded: boolean;
  perUser: Array<{
    userId: string;
    email: string | null;
    plan: PlanId | null;
    priceEur: number | null;
    aiCostUsdThisMonth: number;
    estimatedMarginPercent: number | null;
    underMarginFloor: boolean;
  }>;
};

/** Real per-call AI cost data for the owner console's "Coûts IA" section —
 * see ai_usage_events (migration not applied automatically) and
 * supabase/functions/_shared/ai-pricing.ts, which writes one row per
 * Anthropic call. Returns hasData=false (clean empty state, no fabricated
 * numbers) when the table doesn't exist yet or genuinely has no rows this
 * month — callers must render an honest "no data yet" message in that
 * case, never a zeroed-out dashboard that looks like real data. */
export async function fetchOwnerAiCosts(): Promise<OwnerAiCostsSummary> {
  const supabase = createAdminClient();
  const since = monthStartIso();

  const { data, error } = await supabase
    .from("ai_usage_events")
    .select("user_id, kind, cost_usd, credit_source")
    .gte("created_at", since);

  const hardCapEur = Number(process.env.AI_MONTHLY_HARD_CAP_EUR ?? String(DEFAULT_AI_MONTHLY_HARD_CAP_EUR));

  if (error || !data) {
    // Most likely: the ai_usage_events migration hasn't been applied yet.
    // Logged, not thrown — the page must still render its empty state.
    if (error) console.error("[owner-ai-costs] failed to read ai_usage_events", error);
    return {
      hasData: false,
      totalCostUsdThisMonth: 0,
      avgCostByKind: { standard: null, deep: null, scan: null },
      scanCostUsdThisMonth: 0,
      hardCapEur,
      hardCapExceeded: false,
      perUser: [],
    };
  }

  const rows = data as UsageRow[];
  if (rows.length === 0) {
    return {
      hasData: false,
      totalCostUsdThisMonth: 0,
      avgCostByKind: { standard: null, deep: null, scan: null },
      scanCostUsdThisMonth: 0,
      hardCapEur,
      hardCapExceeded: false,
      perUser: [],
    };
  }

  const totalCostUsdThisMonth = rows.reduce((sum, r) => sum + Number(r.cost_usd ?? 0), 0);
  const scanCostUsdThisMonth = rows
    .filter((r) => r.kind === "scan")
    .reduce((sum, r) => sum + Number(r.cost_usd ?? 0), 0);

  function avgFor(kind: "standard" | "deep" | "scan"): number | null {
    const matching = rows.filter((r) => r.kind === kind);
    if (matching.length === 0) return null;
    return matching.reduce((sum, r) => sum + Number(r.cost_usd ?? 0), 0) / matching.length;
  }

  const byUser = new Map<string, number>();
  for (const row of rows) {
    if (!row.user_id) continue; // scan rows have no user
    byUser.set(row.user_id, (byUser.get(row.user_id) ?? 0) + Number(row.cost_usd ?? 0));
  }

  const userIds = Array.from(byUser.keys());
  let subscriptionsByUser = new Map<string, { plan: PlanId; status: string; cancel_at_period_end: boolean }>();
  let emailsByUser = new Map<string, string | null>();

  if (userIds.length > 0) {
    const { data: subRows } = await supabase
      .from("subscriptions")
      .select("user_id, plan, status, cancel_at_period_end")
      .in("user_id", userIds);
    subscriptionsByUser = new Map(
      (subRows ?? []).map((r) => [
        r.user_id as string,
        { plan: r.plan as PlanId, status: r.status as string, cancel_at_period_end: r.cancel_at_period_end as boolean },
      ])
    );

    // auth.admin.listUsers doesn't support an "in these ids" filter — fetch
    // each user's email individually. userIds is bounded by "distinct users
    // with AI usage this month," never the full user base.
    const emailResults = await Promise.all(
      userIds.map(async (id) => {
        const { data: userData } = await supabase.auth.admin.getUserById(id);
        return [id, userData?.user?.email ?? null] as const;
      })
    );
    emailsByUser = new Map(emailResults);
  }

  const perUser = userIds
    .map((userId) => {
      const sub = subscriptionsByUser.get(userId);
      const hasAccess = sub && (sub.status === "active" || sub.status === "trialing") && !sub.cancel_at_period_end;
      const plan = hasAccess ? sub!.plan : null;
      const priceEur = plan ? getPlanMeta(plan).priceEur : null;
      const aiCostUsdThisMonth = byUser.get(userId) ?? 0;

      let estimatedMarginPercent: number | null = null;
      if (priceEur !== null) {
        const stripeFeeEur = priceEur * STRIPE_FEE_PERCENT + STRIPE_FEE_FIXED_EUR;
        const aiCostEur = aiCostUsdThisMonth / USD_PER_EUR;
        estimatedMarginPercent = ((priceEur - stripeFeeEur - aiCostEur) / priceEur) * 100;
      }

      return {
        userId,
        email: emailsByUser.get(userId) ?? null,
        plan,
        priceEur,
        aiCostUsdThisMonth,
        estimatedMarginPercent,
        underMarginFloor: estimatedMarginPercent !== null && estimatedMarginPercent < 65,
      };
    })
    .sort((a, b) => b.aiCostUsdThisMonth - a.aiCostUsdThisMonth);

  return {
    hasData: true,
    totalCostUsdThisMonth,
    avgCostByKind: { standard: avgFor("standard"), deep: avgFor("deep"), scan: avgFor("scan") },
    scanCostUsdThisMonth,
    hardCapEur,
    hardCapExceeded: totalCostUsdThisMonth >= hardCapEur * USD_PER_EUR,
    perUser,
  };
}
