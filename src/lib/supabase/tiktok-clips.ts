import type { SupabaseClient } from "@supabase/supabase-js";
import { formatRelativeTime } from "@/lib/supabase/analyses";
import type { TiktokSubmission } from "@/lib/data/tiktok-clips";

type TiktokSubmissionRow = {
  id: string;
  tiktok_url: string;
  submitted_at: string;
  status: TiktokSubmission["status"];
  verified_views: number | null;
  rejection_reason: string | null;
  payment_amount: number | null;
  paid_at: string | null;
};

function mapRow(row: TiktokSubmissionRow): TiktokSubmission {
  return {
    id: row.id,
    tiktokUrl: row.tiktok_url,
    submittedAgo: formatRelativeTime(row.submitted_at),
    status: row.status,
    verifiedViews: row.verified_views,
    rejectionReason: row.rejection_reason,
    paymentAmount: row.payment_amount === null ? null : Number(row.payment_amount),
    paidAt: row.paid_at,
  };
}

const SUBMISSION_COLUMNS =
  "id, tiktok_url, submitted_at, status, verified_views, rejection_reason, payment_amount, paid_at";

export async function fetchTiktokSubmissions(
  supabase: SupabaseClient,
  userId: string
): Promise<TiktokSubmission[]> {
  const { data, error } = await supabase
    .from("tiktok_clip_submissions")
    .select(SUBMISSION_COLUMNS)
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false });

  if (error || !data) return [];
  return (data as TiktokSubmissionRow[]).map(mapRow);
}

/** Only checks the domain — never fetches the URL server-side. Real
 * verification (does the video exist, how many views) stays fully manual
 * from the owner console, since there's no TikTok API integration here. */
function isValidTiktokUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /(^|\.)tiktok\.com$/.test(parsed.hostname);
  } catch {
    return false;
  }
}

export async function createTiktokSubmission(
  supabase: SupabaseClient,
  userId: string,
  tiktokUrl: string
): Promise<{ error: string | null; submission: TiktokSubmission | null }> {
  const trimmed = tiktokUrl.trim();
  if (!trimmed) {
    return { error: "Collez le lien de votre vidéo TikTok.", submission: null };
  }
  if (!isValidTiktokUrl(trimmed)) {
    return { error: "Ce lien ne ressemble pas à une URL TikTok valide.", submission: null };
  }

  const { data, error } = await supabase
    .from("tiktok_clip_submissions")
    .insert({ user_id: userId, tiktok_url: trimmed })
    .select(SUBMISSION_COLUMNS)
    .single();

  if (error || !data) {
    console.error("[tiktok-clips] failed to create submission", error);
    return { error: "Impossible d'enregistrer votre soumission. Réessayez.", submission: null };
  }

  return { error: null, submission: mapRow(data as TiktokSubmissionRow) };
}
