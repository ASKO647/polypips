import { createAdminClient } from "@/lib/supabase/admin";

export type OwnerInfluencerListRow = {
  id: string;
  name: string;
  codePromo: string | null;
  trackingSlug: string | null;
  status: "active" | "paused";
  referralsCount: number;
  convertedCount: number;
  conversionRatePercent: number | null;
  commissionPendingEur: number;
  commissionPaidEur: number;
};

export type OwnerInfluencerOverview = {
  totalReferrals: number;
  totalConverted: number;
  bestInfluencer: { name: string; convertedCount: number } | null;
  commissionDueThisMonthEur: number;
};

type RawInfluencer = {
  id: string;
  name: string;
  code_promo: string | null;
  tracking_slug: string | null;
  status: "active" | "paused";
};

type RawReferral = {
  influencer_id: string;
  converted_to_paid: boolean;
  commission_amount: number | null;
  commission_status: "pending" | "paid";
  converted_at: string | null;
};

/** Referral rows + influencer rows in two flat queries, aggregated in
 * memory — the influencer count here is small enough (a handful to a few
 * dozen) that this is simpler and just as fast as a SQL-side aggregate,
 * and keeps the shape identical to owner-acquisition.ts's approach. */
async function fetchInfluencersAndReferrals() {
  const supabase = createAdminClient();

  const { data: influencers, error: influencersError } = await supabase
    .from("influencers")
    .select("id, name, code_promo, tracking_slug, status")
    .order("created_at", { ascending: false });

  const { data: referrals, error: referralsError } = await supabase
    .from("influencer_referrals")
    .select("influencer_id, converted_to_paid, commission_amount, commission_status, converted_at");

  if (influencersError) {
    console.error("[owner-influencers] influencers fetch failed", influencersError);
  }
  if (referralsError) {
    console.error("[owner-influencers] referrals fetch failed", referralsError);
  }

  return {
    influencers: (influencers ?? []) as RawInfluencer[],
    referrals: (referrals ?? []) as RawReferral[],
  };
}

export async function fetchOwnerInfluencers(): Promise<OwnerInfluencerListRow[]> {
  const { influencers, referrals } = await fetchInfluencersAndReferrals();

  const byInfluencer = new Map<
    string,
    { referrals: number; converted: number; pending: number; paid: number }
  >();
  for (const r of referrals) {
    const entry = byInfluencer.get(r.influencer_id) ?? {
      referrals: 0,
      converted: 0,
      pending: 0,
      paid: 0,
    };
    entry.referrals += 1;
    if (r.converted_to_paid) entry.converted += 1;
    const amount = Number(r.commission_amount ?? 0);
    if (r.commission_status === "pending") entry.pending += amount;
    if (r.commission_status === "paid") entry.paid += amount;
    byInfluencer.set(r.influencer_id, entry);
  }

  return influencers.map((inf) => {
    const stats = byInfluencer.get(inf.id) ?? { referrals: 0, converted: 0, pending: 0, paid: 0 };
    return {
      id: inf.id,
      name: inf.name,
      codePromo: inf.code_promo,
      trackingSlug: inf.tracking_slug,
      status: inf.status,
      referralsCount: stats.referrals,
      convertedCount: stats.converted,
      conversionRatePercent: stats.referrals > 0 ? (stats.converted / stats.referrals) * 100 : null,
      commissionPendingEur: stats.pending,
      commissionPaidEur: stats.paid,
    };
  });
}

export async function fetchOwnerInfluencerOverview(): Promise<OwnerInfluencerOverview> {
  const { influencers, referrals } = await fetchInfluencersAndReferrals();

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const convertedByInfluencer = new Map<string, number>();
  let commissionDueThisMonthEur = 0;
  let totalConverted = 0;

  for (const r of referrals) {
    if (r.converted_to_paid) {
      totalConverted += 1;
      convertedByInfluencer.set(
        r.influencer_id,
        (convertedByInfluencer.get(r.influencer_id) ?? 0) + 1
      );
    }
    if (
      r.commission_status === "pending" &&
      r.converted_at &&
      new Date(r.converted_at).getTime() >= monthStart.getTime()
    ) {
      commissionDueThisMonthEur += Number(r.commission_amount ?? 0);
    }
  }

  let bestInfluencer: { name: string; convertedCount: number } | null = null;
  for (const inf of influencers) {
    const count = convertedByInfluencer.get(inf.id) ?? 0;
    if (count > 0 && (!bestInfluencer || count > bestInfluencer.convertedCount)) {
      bestInfluencer = { name: inf.name, convertedCount: count };
    }
  }

  return {
    totalReferrals: referrals.length,
    totalConverted,
    bestInfluencer,
    commissionDueThisMonthEur,
  };
}

export type OwnerInfluencerDetail = {
  id: string;
  name: string;
  codePromo: string | null;
  trackingSlug: string | null;
  commissionType: "percent" | "fixed";
  commissionValue: number;
  status: "active" | "paused";
  contactEmail: string | null;
  notes: string | null;
  createdAt: string;
};

export type OwnerInfluencerReferralRow = {
  id: string;
  userId: string;
  userEmail: string | null;
  referredVia: "code" | "link";
  convertedToPaid: boolean;
  convertedAt: string | null;
  subscriptionAmountEur: number | null;
  commissionAmountEur: number | null;
  commissionStatus: "pending" | "paid";
  createdAt: string;
};

export async function fetchOwnerInfluencerDetail(
  id: string
): Promise<{ influencer: OwnerInfluencerDetail; referrals: OwnerInfluencerReferralRow[] } | null> {
  const supabase = createAdminClient();

  const { data: influencer, error: influencerError } = await supabase
    .from("influencers")
    .select(
      "id, name, code_promo, tracking_slug, commission_type, commission_value, status, contact_email, notes, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (influencerError || !influencer) {
    if (influencerError) console.error("[owner-influencers] detail fetch failed", influencerError);
    return null;
  }

  const { data: referralRows, error: referralsError } = await supabase.rpc(
    "owner_influencer_referrals",
    { p_influencer_id: id }
  );
  if (referralsError) {
    console.error("[owner-influencers] referral history fetch failed", referralsError);
  }

  type RawReferralDetail = {
    id: string;
    user_id: string;
    user_email: string | null;
    referred_via: "code" | "link";
    converted_to_paid: boolean;
    converted_at: string | null;
    subscription_amount: number | null;
    commission_amount: number | null;
    commission_status: "pending" | "paid";
    created_at: string;
  };

  const referrals = ((referralRows ?? []) as RawReferralDetail[]).map((r) => ({
    id: r.id,
    userId: r.user_id,
    userEmail: r.user_email,
    referredVia: r.referred_via,
    convertedToPaid: r.converted_to_paid,
    convertedAt: r.converted_at,
    subscriptionAmountEur: r.subscription_amount !== null ? Number(r.subscription_amount) : null,
    commissionAmountEur: r.commission_amount !== null ? Number(r.commission_amount) : null,
    commissionStatus: r.commission_status,
    createdAt: r.created_at,
  }));

  return {
    influencer: {
      id: influencer.id,
      name: influencer.name,
      codePromo: influencer.code_promo,
      trackingSlug: influencer.tracking_slug,
      commissionType: influencer.commission_type,
      commissionValue: Number(influencer.commission_value),
      status: influencer.status,
      contactEmail: influencer.contact_email,
      notes: influencer.notes,
      createdAt: influencer.created_at,
    },
    referrals,
  };
}
