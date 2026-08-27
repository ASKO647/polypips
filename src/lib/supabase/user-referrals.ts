import type { SupabaseClient } from "@supabase/supabase-js";
import { generateReferralSlug } from "@/lib/referrals/generate-slug";
import type { ReferralAttribution } from "@/lib/referrals/attribution";
import { formatRelativeTime } from "@/lib/supabase/analyses";
import type { ReferralHistoryItem, ReferralStats, ReferralStatus } from "@/lib/data/referrals";

export async function fetchReferralSlug(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("user_referral_links")
    .select("slug")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.slug ?? null;
}

const MAX_SLUG_ATTEMPTS = 5;

/** Lazily creates this user's referral link the first time they visit the
 * "Inviter et gagner" tab — see referral-actions.ts, called from
 * ReferralTab's mount effect. Retries a fresh random slug on a unique-
 * constraint collision (astronomically rare at 10 hex chars, but the
 * insert is cheap enough that a short retry loop costs nothing). */
export async function ensureReferralSlug(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const existing = await fetchReferralSlug(supabase, userId);
  if (existing) return existing;

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = generateReferralSlug();
    const { error } = await supabase.from("user_referral_links").insert({ user_id: userId, slug });
    if (!error) return slug;

    // A concurrent request (e.g. two tabs) may have already created this
    // user's row between the read above and this insert — re-read instead
    // of endlessly retrying a new slug that will never be needed.
    const raceExisting = await fetchReferralSlug(supabase, userId);
    if (raceExisting) return raceExisting;

    if (error.code !== "23505") {
      console.error("[user-referrals] failed to create referral link", error);
      return null;
    }
  }
  return null;
}

export async function fetchReferralStats(
  supabase: SupabaseClient,
  userId: string
): Promise<ReferralStats> {
  const { data, error } = await supabase
    .from("user_referrals")
    .select("converted_to_paid, commission_amount, commission_status")
    .eq("referrer_user_id", userId);

  if (error || !data) return { totalReferred: 0, totalConverted: 0, pendingEur: 0, paidEur: 0 };

  let totalConverted = 0;
  let pendingEur = 0;
  let paidEur = 0;
  for (const row of data) {
    if (!row.converted_to_paid) continue;
    totalConverted += 1;
    const amount = Number(row.commission_amount ?? 0);
    if (row.commission_status === "paid") paidEur += amount;
    else pendingEur += amount;
  }

  return { totalReferred: data.length, totalConverted, pendingEur, paidEur };
}

export async function fetchReferralHistory(
  supabase: SupabaseClient,
  userId: string
): Promise<ReferralHistoryItem[]> {
  const { data, error } = await supabase
    .from("user_referrals")
    .select("id, converted_to_paid, commission_amount, commission_status, created_at")
    .eq("referrer_user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    let status: ReferralStatus = "inscrit";
    if (row.converted_to_paid) {
      status = row.commission_status === "paid" ? "commission_payee" : "commission_en_attente";
    }
    return {
      id: row.id as string,
      status,
      commissionAmount: row.commission_amount === null ? null : Number(row.commission_amount),
      referredAgo: formatRelativeTime(row.created_at as string),
    };
  });
}

/** Writes the user_referrals row once a signup actually completes — same
 * idempotency reasoning as recordInfluencerReferral (referred_user_id is
 * unique, so a re-triggered call is a harmless no-op). Also the app-layer
 * self-referral guard (the DB's own check constraint is the real
 * enforcement — this just avoids a doomed insert attempt). */
export async function recordReferralAttribution(
  supabase: SupabaseClient,
  referredUserId: string,
  attribution: ReferralAttribution
): Promise<void> {
  if (referredUserId === attribution.referrerUserId) return;

  const { error } = await supabase.from("user_referrals").upsert(
    {
      referrer_user_id: attribution.referrerUserId,
      referred_user_id: referredUserId,
      referral_code: attribution.slug,
    },
    { onConflict: "referred_user_id", ignoreDuplicates: true }
  );
  if (error) {
    console.error("[user-referrals] failed to record referral", error);
  }
}
