import type { SupabaseClient } from "@supabase/supabase-js";
import { enrichTokenWithDexscreener } from "@/lib/pips-tracks/dexscreener";
import {
  PIPS_TRACK_EVENTS_PAGE_SIZE,
  type PipsTrackAlert,
  type PipsTrackEvent,
  type PipsTrackFilterValue,
  type PipsTrackSummary,
  type PipsTrackTopToken,
} from "@/lib/data/pips-tracks";

function mapRow(row: Record<string, unknown>): PipsTrackEvent {
  return {
    id: row.id as string,
    source: row.source as PipsTrackEvent["source"],
    eventType: row.event_type as PipsTrackEvent["eventType"],
    title: row.title as string,
    description: row.description as string,
    tokenSymbol: row.token_symbol as string | null,
    walletAddress: row.wallet_address as string | null,
    walletLabel: row.wallet_label as string | null,
    amountUsd: row.amount_usd !== null && row.amount_usd !== undefined ? Number(row.amount_usd) : null,
    price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
    aiScore: row.ai_score !== null && row.ai_score !== undefined ? Number(row.ai_score) : null,
    aiWinRate: row.ai_win_rate !== null && row.ai_win_rate !== undefined ? Number(row.ai_win_rate) : null,
    aiImpact: row.ai_impact as PipsTrackEvent["aiImpact"],
    externalUrl: row.external_url as string | null,
    dataSourceMode: row.data_source_mode as PipsTrackEvent["dataSourceMode"],
    occurredAt: row.occurred_at as string,
  };
}

/** Translates the filter bar's tab value into the right WHERE clause —
 * "signal_ia" filters by event_type (a Signal IA row's `source` column is
 * still fomo/axiom), every other value filters by `source` and excludes
 * signal_ia rows so they only ever appear under their own tab (or "Tous"),
 * never duplicated under the plain FOMO/AXIOM tabs. */
export async function fetchEvents(
  supabase: SupabaseClient,
  options: { filter?: PipsTrackFilterValue; before?: string } = {}
): Promise<PipsTrackEvent[]> {
  let query = supabase
    .from("pips_track_events")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(PIPS_TRACK_EVENTS_PAGE_SIZE);

  if (options.filter === "signal_ia") {
    query = query.eq("event_type", "signal_ia");
  } else if (options.filter && options.filter !== "all") {
    query = query.eq("source", options.filter).neq("event_type", "signal_ia");
  }
  if (options.before) {
    query = query.lt("occurred_at", options.before);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function fetchSummary(supabase: SupabaseClient): Promise<PipsTrackSummary | null> {
  const { data, error } = await supabase.rpc("pips_tracks_summary");
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    eventsToday: Number(row.eventsToday ?? 0),
    signalsToday: Number(row.signalsToday ?? 0),
    buysToday: Number(row.buysToday ?? 0),
    sellsToday: Number(row.sellsToday ?? 0),
    activeWallets: Number(row.activeWallets ?? 0),
  };
}

/** Mention counts always come from pips_track_events (real); the
 * changePercent/logoUrl enrichment is a best-effort Dexscreener lookup
 * that legitimately comes back null for symbols with no resolvable
 * Solana pair (expected for mock/demo tokens) — never blocks the panel. */
export async function fetchTopTokens(supabase: SupabaseClient, limit = 5): Promise<PipsTrackTopToken[]> {
  const { data, error } = await supabase.rpc("pips_tracks_top_tokens", { p_limit: limit });
  if (error || !data) return [];
  const rows = data as { token_symbol: string; mention_count: number }[];
  const enrichments = await Promise.all(rows.map((row) => enrichTokenWithDexscreener(row.token_symbol)));
  return rows.map((row, i) => ({
    tokenSymbol: row.token_symbol,
    mentionCount: Number(row.mention_count ?? 0),
    changePercent: enrichments[i].changePercent,
    logoUrl: enrichments[i].logoUrl,
  }));
}

export async function createAlert(
  supabase: SupabaseClient,
  input: { tokenSymbol: string | null; minAmountUsd: number | null }
): Promise<PipsTrackAlert> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Authentification requise.");

  const { data, error } = await supabase
    .from("user_pips_track_alerts")
    .insert({
      user_id: userData.user.id,
      token_symbol: input.tokenSymbol,
      min_amount_usd: input.minAmountUsd,
    })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "Alerte non enregistrée.");
  return {
    id: data.id as string,
    tokenSymbol: data.token_symbol as string | null,
    minAmountUsd: data.min_amount_usd !== null ? Number(data.min_amount_usd) : null,
    createdAt: data.created_at as string,
  };
}

/** Caller owns the channel's lifecycle (supabase.removeChannel(channel) on
 * cleanup) — same contract as subscribeToGroupMessages in
 * lib/supabase/community.ts. No filter: this is a shared, all-users feed,
 * not scoped to one group, so every insert is relevant to every
 * subscriber; client-side filtering (by the active tab) happens in the
 * caller's onInsert handler instead. */
export function subscribeToPipsTrackEvents(
  supabase: SupabaseClient,
  onInsert: (event: PipsTrackEvent) => void
) {
  return supabase
    .channel("pips-track-events")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "pips_track_events" },
      (payload) => onInsert(mapRow(payload.new as Record<string, unknown>))
    )
    .subscribe();
}
