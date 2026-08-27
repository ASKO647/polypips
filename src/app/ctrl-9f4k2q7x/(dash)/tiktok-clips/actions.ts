"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerUser } from "@/lib/supabase/owner";
import { logOwnerEvent } from "@/lib/supabase/owner-audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { OWNER_BASE_PATH } from "@/lib/owner-path";
import { TIKTOK_RATE_PER_1000_VIEWS_EUR } from "@/lib/data/tiktok-clips";

const BASE = `${OWNER_BASE_PATH}/tiktok-clips`;

/** The owner has gone to watch the video and counted (or read off TikTok's
 * own analytics) the real view count — verified_views is never inferred or
 * fetched automatically. Payment is computed here, once, from the fixed
 * rate; it is not recalculated later even if the video's view count
 * changes. */
export async function approveTiktokSubmission(
  submissionId: string,
  verifiedViews: number
): Promise<{ error: string | null }> {
  const owner = await requireOwnerUser();
  if (!owner) return { error: "unauthorized" };

  if (!Number.isFinite(verifiedViews) || verifiedViews < 0) {
    return { error: "Le nombre de vues doit être un entier positif." };
  }

  const paymentAmount = (verifiedViews / 1000) * TIKTOK_RATE_PER_1000_VIEWS_EUR;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("tiktok_clip_submissions")
    .update({
      status: "verified",
      verified_views: verifiedViews,
      payment_amount: paymentAmount,
      rejection_reason: null,
    })
    .eq("id", submissionId);

  await logOwnerEvent({
    event: "owner_tiktok_submission_approved",
    result: error ? "failure" : "success",
    userId: owner.id,
    email: owner.email,
    detail: { submissionId, verifiedViews, paymentAmount, error: error?.message },
  });

  revalidatePath(BASE);
  return { error: error ? "Impossible d'approuver cette soumission." : null };
}

export async function rejectTiktokSubmission(
  submissionId: string,
  reason: string
): Promise<{ error: string | null }> {
  const owner = await requireOwnerUser();
  if (!owner) return { error: "unauthorized" };

  const trimmedReason = reason.trim();
  if (!trimmedReason) return { error: "Indiquez un motif de refus." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("tiktok_clip_submissions")
    .update({ status: "rejected", rejection_reason: trimmedReason })
    .eq("id", submissionId);

  await logOwnerEvent({
    event: "owner_tiktok_submission_rejected",
    result: error ? "failure" : "success",
    userId: owner.id,
    email: owner.email,
    detail: { submissionId, reason: trimmedReason, error: error?.message },
  });

  revalidatePath(BASE);
  return { error: error ? "Impossible de refuser cette soumission." : null };
}

/** Manual-only, as specced — no automatic payout. */
export async function markTiktokSubmissionPaid(submissionId: string): Promise<void> {
  const owner = await requireOwnerUser();
  if (!owner) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("tiktok_clip_submissions")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", submissionId);

  await logOwnerEvent({
    event: "owner_tiktok_submission_marked_paid",
    result: error ? "failure" : "success",
    userId: owner.id,
    email: owner.email,
    detail: { submissionId, error: error?.message },
  });

  revalidatePath(BASE);
}
