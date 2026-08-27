import { createAdminClient } from "@/lib/supabase/admin";

export type OwnerTiktokSubmissionRow = {
  id: string;
  userId: string;
  userEmail: string | null;
  tiktokUrl: string;
  submittedAt: string;
  status: "pending" | "verified" | "rejected" | "paid";
  verifiedViews: number | null;
  rejectionReason: string | null;
  paymentAmountEur: number | null;
  paidAt: string | null;
};

type RawOwnerTiktokSubmission = {
  id: string;
  user_id: string;
  user_email: string | null;
  tiktok_url: string;
  submitted_at: string;
  status: "pending" | "verified" | "rejected" | "paid";
  verified_views: number | null;
  rejection_reason: string | null;
  payment_amount: number | null;
  paid_at: string | null;
};

export async function fetchOwnerTiktokSubmissions(): Promise<OwnerTiktokSubmissionRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("owner_tiktok_clip_submissions");

  if (error) {
    console.error("[owner-tiktok-clips] fetch failed", error);
    return [];
  }

  return ((data ?? []) as RawOwnerTiktokSubmission[]).map((s) => ({
    id: s.id,
    userId: s.user_id,
    userEmail: s.user_email,
    tiktokUrl: s.tiktok_url,
    submittedAt: s.submitted_at,
    status: s.status,
    verifiedViews: s.verified_views,
    rejectionReason: s.rejection_reason,
    paymentAmountEur: s.payment_amount !== null ? Number(s.payment_amount) : null,
    paidAt: s.paid_at,
  }));
}
