/**
 * Real data: the "Monétiser mon TikTok" clipping program (Settings). A
 * user submits a published TikTok video link; the owner manually verifies
 * its view count and approves/rejects from the console — never an
 * automatic payout, and never an automatic view count (no TikTok API
 * integration here). See lib/supabase/tiktok-clips.ts.
 */

export const TIKTOK_RATE_PER_1000_VIEWS_EUR = 0.5;

export type TiktokSubmissionStatus = "pending" | "verified" | "rejected" | "paid";

export const TIKTOK_STATUS_LABELS: Record<TiktokSubmissionStatus, string> = {
  pending: "En attente de vérification",
  verified: "Vues validées",
  rejected: "Refusée",
  paid: "Payée",
};

export type TiktokSubmission = {
  id: string;
  tiktokUrl: string;
  submittedAgo: string;
  status: TiktokSubmissionStatus;
  verifiedViews: number | null;
  rejectionReason: string | null;
  paymentAmount: number | null;
  paidAt: string | null;
};
