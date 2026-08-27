/**
 * Real data: the "Inviter et gagner" user referral program (Settings). One
 * fixed system-wide commission — unlike influencers' configurable
 * percent/fixed rate — paid manually by the owner, never automatically.
 * See lib/supabase/user-referrals.ts for the read/write layer and
 * src/app/r/[slug]/route.ts for the attribution link.
 */

export const REFERRAL_COMMISSION_EUR = 1;

/** A referral's display status folds converted_to_paid + commission_status
 * into one value: "devenu payant" and "commission en attente" describe the
 * same moment (you can't have a pending commission without having
 * converted), so there are only 3 real states, not 4. */
export type ReferralStatus = "inscrit" | "commission_en_attente" | "commission_payee";

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  inscrit: "Inscrit",
  commission_en_attente: "Devenu payant · commission en attente",
  commission_payee: "Devenu payant · commission payée",
};

export type ReferralHistoryItem = {
  id: string;
  status: ReferralStatus;
  commissionAmount: number | null;
  referredAgo: string;
};

export type ReferralStats = {
  totalReferred: number;
  totalConverted: number;
  pendingEur: number;
  paidEur: number;
};
