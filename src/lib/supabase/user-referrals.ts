import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReferralAttribution } from "@/lib/referrals/attribution";

/** Lowercase hex only, matching user_referral_links_slug_format's check
 * constraint — never human-typed. */
function generateReferralSlug(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

/** Fetches this user's referral slug, creating one lazily on first call —
 * see the "created lazily" comment on user_referral_links itself. Retries
 * on a slug collision (astronomically rare at 8 hex chars, but cheap to
 * handle correctly rather than assume away) by re-checking for a row a
 * concurrent call may have already created. */
export async function ensureReferralSlug(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("user_referral_links")
    .select("slug")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing.slug as string;

  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = generateReferralSlug();
    const { data, error } = await supabase
      .from("user_referral_links")
      .insert({ user_id: userId, slug })
      .select("slug")
      .single();
    if (!error) return data.slug as string;

    // 23505 = unique_violation. Could be the slug (collision — retry with
    // a new one) or user_id (a concurrent call already created this
    // user's row — fetch and return it instead of retrying forever).
    if (error.code !== "23505") break;
    const { data: raceWinner } = await supabase
      .from("user_referral_links")
      .select("slug")
      .eq("user_id", userId)
      .maybeSingle();
    if (raceWinner) return raceWinner.slug as string;
  }
  return null;
}

/** Marks the user as "welcomed" — idempotent server-side (see
 * ensure_welcome_credits' partial unique index), so safe to call from
 * every signup path without tracking "have we already called this"
 * client-side. No longer grants any credits (WELCOME_CREDITS = 0 in
 * src/lib/data/pricing.ts — margin protection; was 15). Still called from
 * the same two call sites as recordSignupSource/recordInfluencerReferral:
 * signup-form.tsx's immediate-session branch and /auth/callback. */
export async function ensureWelcomeCredits(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.rpc("ensure_welcome_credits");
  if (error) {
    console.error("[user-referrals] ensure_welcome_credits failed", error);
  }
}

/** Records a referred signup — no credit grant anymore (margin
 * protection: referral bonuses now pay out only on the referred user's
 * first real payment, via recordUserReferralConversion below). Same two
 * call sites as ensureWelcomeCredits. A no-op server-side if the slug is
 * unknown, a self-referral, or this user was already referred. */
export async function recordUserReferral(
  supabase: SupabaseClient,
  attribution: ReferralAttribution
): Promise<void> {
  const { error } = await supabase.rpc("record_user_referral", { p_slug: attribution.slug });
  if (error) {
    console.error("[user-referrals] record_user_referral failed", error);
  }
}

/** Called from the Stripe webhook's checkout.session.completed handler
 * (service_role), right next to recordInfluencerConversion — grants BOTH
 * the referred user's +5 credits and the referrer's +10 credits, once the
 * referred user's first real subscription payment actually goes through
 * (never at signup — margin protection). Idempotent server-side (see
 * record_user_referral_conversion's atomic UPDATE ... WHERE
 * referrer_credited_at IS NULL), so a redelivered webhook event is safely
 * a no-op. */
export async function recordUserReferralConversion(
  supabase: SupabaseClient,
  referredUserId: string
): Promise<void> {
  const { error } = await supabase.rpc("record_user_referral_conversion", {
    p_referred_user_id: referredUserId,
  });
  if (error) {
    console.error("[user-referrals] record_user_referral_conversion failed", error);
  }
}
