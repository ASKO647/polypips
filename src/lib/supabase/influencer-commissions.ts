import type { SupabaseClient } from "@supabase/supabase-js";

type InfluencerCommissionRow = { commission_type: "percent" | "fixed"; commission_value: number };
type ReferralRow = { id: string; influencer_id: string; converted_to_paid: boolean };

/**
 * Called from the Stripe webhook's checkout.session.completed handler
 * with the session's own amount_total (the real first-payment amount, in
 * cents — no separate invoice fetch needed). A no-op if this user was
 * never referred, or if their referral already converted (Stripe webhooks
 * are at-least-once delivery, so this guards against double-crediting a
 * commission on a redelivered event).
 */
export async function recordInfluencerConversion(
  supabase: SupabaseClient,
  userId: string,
  amountTotalCents: number | null | undefined
): Promise<void> {
  if (!amountTotalCents) return;

  const { data: referral, error: referralError } = await supabase
    .from("influencer_referrals")
    .select("id, influencer_id, converted_to_paid")
    .eq("user_id", userId)
    .maybeSingle();

  if (referralError) {
    console.error("[influencer-commissions] referral lookup failed", referralError);
    return;
  }
  if (!referral) return; // not a referred signup

  const row = referral as ReferralRow;
  if (row.converted_to_paid) return; // already credited — see the redelivery note above

  const { data: influencer, error: influencerError } = await supabase
    .from("influencers")
    .select("commission_type, commission_value")
    .eq("id", row.influencer_id)
    .maybeSingle();

  if (influencerError || !influencer) {
    console.error("[influencer-commissions] influencer lookup failed", influencerError);
    return;
  }

  const { commission_type, commission_value } = influencer as InfluencerCommissionRow;
  const subscriptionAmountEur = amountTotalCents / 100;
  const commissionAmountEur =
    commission_type === "percent"
      ? subscriptionAmountEur * (Number(commission_value) / 100)
      : Number(commission_value);

  const { error: updateError } = await supabase
    .from("influencer_referrals")
    .update({
      converted_to_paid: true,
      converted_at: new Date().toISOString(),
      subscription_amount: subscriptionAmountEur,
      commission_amount: commissionAmountEur,
    })
    .eq("id", row.id);

  if (updateError) {
    console.error("[influencer-commissions] referral update failed", updateError);
  }
}
