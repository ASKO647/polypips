import { createAdminClient } from "@/lib/supabase/admin";

export type OwnerAcquisitionSourceRow = {
  source: string;
  medium: string | null;
  signups: number;
  converted: number;
  conversionRatePercent: number | null;
};

export type OwnerAcquisitionSummary = {
  totalSignups: number;
  totalConverted: number;
  bySource: OwnerAcquisitionSourceRow[];
};

const EMPTY_SUMMARY: OwnerAcquisitionSummary = {
  totalSignups: 0,
  totalConverted: 0,
  bySource: [],
};

/**
 * "Converted" here means the signup currently has an active or trialing
 * subscriptions row — i.e. has entered a paid trial or become a recurring
 * Pro subscriber (see the "every checkout starts life as a trial" comment
 * in owner-subscriptions.ts). It intentionally does not require status
 * 'active' alone, since a brand-new trial that hasn't converted to Pro yet
 * is still a real business outcome for a source, not a null result.
 */
export async function fetchOwnerAcquisitionSummary(
  since: Date | null
): Promise<OwnerAcquisitionSummary> {
  const supabase = createAdminClient();

  let sourcesQuery = supabase
    .from("signup_sources")
    .select("user_id, utm_source, utm_medium, created_at");
  if (since) sourcesQuery = sourcesQuery.gte("created_at", since.toISOString());
  const { data: sources, error: sourcesError } = await sourcesQuery;

  if (sourcesError || !sources) {
    console.error("[owner-acquisition] signup_sources fetch failed", sourcesError);
    return EMPTY_SUMMARY;
  }

  const { data: subs, error: subsError } = await supabase
    .from("subscriptions")
    .select("user_id, status");
  if (subsError) {
    console.error("[owner-acquisition] subscriptions fetch failed", subsError);
  }

  const rows = sources as { user_id: string; utm_source: string; utm_medium: string | null }[];
  const convertedUserIds = new Set(
    ((subs ?? []) as { user_id: string; status: string }[])
      .filter((s) => s.status === "active" || s.status === "trialing")
      .map((s) => s.user_id)
  );

  const bySourceMap = new Map<
    string,
    { medium: string | null; signups: number; converted: number }
  >();
  for (const row of rows) {
    const key = row.utm_source || "direct";
    const entry = bySourceMap.get(key) ?? { medium: row.utm_medium, signups: 0, converted: 0 };
    entry.signups += 1;
    if (convertedUserIds.has(row.user_id)) entry.converted += 1;
    bySourceMap.set(key, entry);
  }

  const bySource = Array.from(bySourceMap.entries())
    .map(([source, v]) => ({
      source,
      medium: v.medium,
      signups: v.signups,
      converted: v.converted,
      conversionRatePercent: v.signups > 0 ? (v.converted / v.signups) * 100 : null,
    }))
    .sort((a, b) => b.signups - a.signups);

  return {
    totalSignups: rows.length,
    totalConverted: rows.filter((r) => convertedUserIds.has(r.user_id)).length,
    bySource,
  };
}
