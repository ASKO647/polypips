import type { SupabaseClient } from "@supabase/supabase-js";
import { REFERRAL_COMMISSION_EUR } from "@/lib/data/referrals";

type ReferralRow = { id: string; converted_to_paid: boolean };

/**
 * Called from the Stripe webhook's checkout.session.completed handler,
 * alongside recordInfluencerConversion — same no-op guards (never
 * referred, or already converted, which protects against Stripe's
 * at-least-once delivery re-crediting a commission). Unlike the influencer
 * program, the commission is a fixed 1€ regardless of the subscription
 * amount — "gagnez 1€ dès qu'il devient abonné Pro", not a percentage.
 */
export async function recordReferralConversion(
  supabase: SupabaseClient,
  userId: string,
  amountTotalCents: number | null | undefined
): Promise<void> {
  if (!amountTotalCents) return;

  const { data: referral, error: referralError } = await supabase
    .from("user_referrals")
    .select("id, converted_to_paid")
    .eq("referred_user_id", userId)
    .maybeSingle();

  if (referralError) {
    console.error("[user-referral-conversions] referral lookup failed", referralError);
    return;
  }
  if (!referral) return; // not a referred signup

  const row = referral as ReferralRow;
  if (row.converted_to_paid) return; // already credited — see the redelivery note above

  const { error: updateError } = await supabase
    .from("user_referrals")
    .update({
      converted_to_paid: true,
      converted_at: new Date().toISOString(),
      commission_amount: REFERRAL_COMMISSION_EUR,
    })
    .eq("id", row.id);

  if (updateError) {
    console.error("[user-referral-conversions] referral update failed", updateError);
  }
}
