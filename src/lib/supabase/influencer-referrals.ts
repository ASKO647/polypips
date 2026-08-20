import type { SupabaseClient } from "@supabase/supabase-js";
import type { InfluencerAttribution } from "@/lib/influencers/attribution";

/**
 * Writes the influencer_referrals row once a signup actually completes —
 * same two call sites and same idempotency reasoning as
 * recordSignupSource in signup-sources.ts (user_id is unique on this
 * table too, so a re-triggered call is a harmless no-op via
 * ignoreDuplicates rather than overwriting the real first attribution).
 */
export async function recordInfluencerReferral(
  supabase: SupabaseClient,
  userId: string,
  attribution: InfluencerAttribution
): Promise<void> {
  const { error } = await supabase.from("influencer_referrals").upsert(
    {
      influencer_id: attribution.influencerId,
      user_id: userId,
      referred_via: attribution.referredVia,
    },
    { onConflict: "user_id", ignoreDuplicates: true }
  );
  if (error) {
    console.error("[influencer-referrals] failed to record referral", error);
  }
}
