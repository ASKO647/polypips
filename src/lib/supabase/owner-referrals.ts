import { createAdminClient } from "@/lib/supabase/admin";

export type OwnerReferralRow = {
  id: string;
  referrerUserId: string;
  referrerEmail: string | null;
  referredUserId: string;
  referredEmail: string | null;
  referralCode: string;
  convertedToPaid: boolean;
  convertedAt: string | null;
  commissionAmountEur: number | null;
  commissionStatus: "pending" | "paid";
  createdAt: string;
};

type RawOwnerReferral = {
  id: string;
  referrer_user_id: string;
  referrer_email: string | null;
  referred_user_id: string;
  referred_email: string | null;
  referral_code: string;
  converted_to_paid: boolean;
  converted_at: string | null;
  commission_amount: number | null;
  commission_status: "pending" | "paid";
  created_at: string;
};

/** auth.users isn't exposed via PostgREST, so owner_user_referrals() (a
 * security definer SQL function) is the only way to join referrer/referred
 * emails server-side in one query — see the migration for the function
 * itself, and owner-influencers.ts for the identical pattern. */
export async function fetchOwnerReferrals(): Promise<OwnerReferralRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("owner_user_referrals");

  if (error) {
    console.error("[owner-referrals] fetch failed", error);
    return [];
  }

  return ((data ?? []) as RawOwnerReferral[]).map((r) => ({
    id: r.id,
    referrerUserId: r.referrer_user_id,
    referrerEmail: r.referrer_email,
    referredUserId: r.referred_user_id,
    referredEmail: r.referred_email,
    referralCode: r.referral_code,
    convertedToPaid: r.converted_to_paid,
    convertedAt: r.converted_at,
    commissionAmountEur: r.commission_amount !== null ? Number(r.commission_amount) : null,
    commissionStatus: r.commission_status,
    createdAt: r.created_at,
  }));
}
