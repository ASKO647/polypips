import type { SupabaseClient } from "@supabase/supabase-js";
import { countAnalysesAllTime } from "@/lib/supabase/analyses";
import { countFollowedWallets } from "@/lib/supabase/wallets";
import { fetchUserFollowedSignalWalletIds } from "@/lib/supabase/signal-wallets";

export type ProfileActivityStats = {
  analysesCount: number;
  marketsFollowedCount: number;
  walletsFollowedCount: number;
  copiedTradesCount: number;
};

export const EMPTY_PROFILE_ACTIVITY_STATS: ProfileActivityStats = {
  analysesCount: 0,
  marketsFollowedCount: 0,
  walletsFollowedCount: 0,
  copiedTradesCount: 0,
};

/** No per-user "followed markets" table exists — the distinct set of
 * markets a user has actually requested an analysis for is the closest
 * real proxy to "marchés suivis" already available, rather than a
 * fabricated number or an always-empty stat. */
async function countDistinctMarketsAnalyzed(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data } = await supabase
    .from("analyses")
    .select("market_slug")
    .eq("user_id", userId)
    .not("market_slug", "is", null);

  const slugs = new Set((data ?? []).map((row) => row.market_slug as string));
  return slugs.size;
}

/** Only suggestions the copy-trading engine actually decided to copie
 * (not the ones it chose to ignore) count as a "trade copié" — summed
 * across both universes (Polymarket's copy_trading_suggestions, Fomo/
 * Axiom's signal_copy_trades), which have no combined table of their own. */
async function countCopiedTrades(supabase: SupabaseClient, userId: string): Promise<number> {
  const [{ count: polymarketCount }, { count: signalCount }] = await Promise.all([
    supabase
      .from("copy_trading_suggestions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("decision", "copie"),
    supabase
      .from("signal_copy_trades")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("decision", "copie"),
  ]);
  return (polymarketCount ?? 0) + (signalCount ?? 0);
}

/** "Smart Wallets suivis" spans two universes with separate follow tables
 * (Polymarket's user_wallet_follows, Fomo/Axiom's
 * user_signal_wallet_follows) and no existing combined total — this sums
 * both rather than picking just one. */
export async function fetchProfileActivityStats(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileActivityStats> {
  const [analysesCount, marketsFollowedCount, walletsFollowedCount, signalWalletIds, copiedTradesCount] =
    await Promise.all([
      countAnalysesAllTime(supabase, userId),
      countDistinctMarketsAnalyzed(supabase, userId),
      countFollowedWallets(supabase, userId),
      fetchUserFollowedSignalWalletIds(supabase, userId),
      countCopiedTrades(supabase, userId),
    ]);

  return {
    analysesCount,
    marketsFollowedCount,
    walletsFollowedCount: walletsFollowedCount + signalWalletIds.size,
    copiedTradesCount,
  };
}
