import { createAdminClient } from "@/lib/supabase/admin";
import { bucketCountsByDay } from "@/lib/utils";

/** Site-wide row count for a table, optionally scoped to a `since` cutoff
 * on `column` — head:true means Postgres never returns the rows
 * themselves, only the count, so this stays cheap regardless of table
 * size. */
async function countSince(
  table: string,
  column: string,
  since: Date | null,
  extraFilter?: { column: string; value: string }
) {
  const supabase = createAdminClient();
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (since) query = query.gte(column, since.toISOString());
  if (extraFilter) query = query.eq(extraFilter.column, extraFilter.value);
  const { count, error } = await query;
  if (error) {
    console.error(`[owner-usage] count failed for ${table}`, error);
    return 0;
  }
  return count ?? 0;
}

export type OwnerProductUsage = {
  analyses: number;
  selectedMarkets: number;
  smartMoneyFollows: number;
  copyTradingActiveStrategies: number;
  coachMessages: number;
  communityMessages: number;
};

/** One count per feature, all scoped to the same period — powers the
 * Product Usage page's per-feature breakdown. "Statistiques" isn't
 * included: nothing in the schema records a page visit, only the actions
 * that feed it (analyses, wallet follows, etc.), which are already counted
 * elsewhere here. */
export async function fetchOwnerProductUsage(since: Date | null): Promise<OwnerProductUsage> {
  const [
    analyses,
    selectedMarkets,
    smartMoneyFollows,
    copyTradingActiveStrategies,
    coachMessages,
    communityMessages,
  ] = await Promise.all([
    countSince("analyses", "created_at", since),
    countSince("selected_markets", "scanned_at", since),
    countSince("user_wallet_follows", "created_at", since),
    countSince("copy_trading_strategies", "created_at", since, {
      column: "status",
      value: "active",
    }),
    countSince("coach_messages", "created_at", since, { column: "role", value: "user" }),
    countSince("group_messages", "created_at", since),
  ]);

  return {
    analyses,
    selectedMarkets,
    smartMoneyFollows,
    copyTradingActiveStrategies,
    coachMessages,
    communityMessages,
  };
}

export type OwnerAiUsage = {
  analysesTotal: number;
  analysesToday: number;
  coachMessagesTotal: number;
  marketsAnalyzed: number;
  activeAiUsers: number;
  evolution30d: number[];
};

/** activeAiUsers counts distinct users who ran at least one analysis in the
 * period — a real usage signal, not a login count. evolution30d reuses the
 * same day-bucketing convention as the user dashboard's own sparklines
 * (lib/utils.ts bucketCountsByDay), capped to the last 90 raw timestamps
 * fetched so this never pulls an unbounded table into memory. */
export async function fetchOwnerAiUsage(): Promise<OwnerAiUsage> {
  const supabase = createAdminClient();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [
    analysesTotal,
    analysesToday,
    coachMessagesTotal,
    { data: recentAnalyses },
    { data: userIds },
  ] = await Promise.all([
    countSince("analyses", "created_at", null),
    countSince("analyses", "created_at", todayStart),
    countSince("coach_messages", "created_at", null, { column: "role", value: "user" }),
    supabase
      .from("analyses")
      .select("created_at")
      .gte("created_at", ninetyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("analyses")
      .select("user_id")
      .gte("created_at", ninetyDaysAgo.toISOString())
      .limit(5000),
  ]);

  const timestamps = (recentAnalyses ?? []).map((r) => r.created_at as string);
  const distinctUsers = new Set((userIds ?? []).map((r) => r.user_id as string));

  // selected_markets isn't user-scoped (it's the AI's own periodic scan,
  // shared across everyone — see the table's own comment in its
  // migration), so "marchés analysés" here is a straight all-time count.
  const marketsAnalyzed = await countSince("selected_markets", "scanned_at", null);

  return {
    analysesTotal,
    analysesToday,
    coachMessagesTotal,
    marketsAnalyzed,
    activeAiUsers: distinctUsers.size,
    evolution30d: bucketCountsByDay(timestamps, 30),
  };
}
