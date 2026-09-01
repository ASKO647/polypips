import type { SupabaseClient } from "@supabase/supabase-js";
import { countAnalysesAllTime } from "@/lib/supabase/analyses";
import { countFollowedWallets } from "@/lib/supabase/wallets";

export type ProfileActivityStats = {
  analysesCount: number;
  marketsFollowedCount: number;
  walletsFollowedCount: number;
};

export const EMPTY_PROFILE_ACTIVITY_STATS: ProfileActivityStats = {
  analysesCount: 0,
  marketsFollowedCount: 0,
  walletsFollowedCount: 0,
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

export async function fetchProfileActivityStats(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileActivityStats> {
  const [analysesCount, marketsFollowedCount, walletsFollowedCount] = await Promise.all([
    countAnalysesAllTime(supabase, userId),
    countDistinctMarketsAnalyzed(supabase, userId),
    countFollowedWallets(supabase, userId),
  ]);

  return {
    analysesCount,
    marketsFollowedCount,
    walletsFollowedCount,
  };
}
