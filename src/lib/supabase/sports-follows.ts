import type { SupabaseClient } from "@supabase/supabase-js";

/** Same shape as fetchUserFollowedWalletIds in lib/supabase/wallets.ts —
 * kept as two small functions rather than one generic helper since match
 * and team follows are two distinct tables (sports_match_follows /
 * sports_team_follows), not a shared polymorphic one. */
export async function fetchFollowedMatchIds(
  supabase: SupabaseClient,
  userId: string | null
): Promise<Set<string>> {
  if (!userId) return new Set();
  const { data, error } = await supabase
    .from("sports_match_follows")
    .select("match_id")
    .eq("user_id", userId);
  if (error || !data) return new Set();
  return new Set(data.map((r) => r.match_id as string));
}

export async function fetchFollowedTeamIds(
  supabase: SupabaseClient,
  userId: string | null
): Promise<Set<string>> {
  if (!userId) return new Set();
  const { data, error } = await supabase
    .from("sports_team_follows")
    .select("team_id")
    .eq("user_id", userId);
  if (error || !data) return new Set();
  return new Set(data.map((r) => r.team_id as string));
}
