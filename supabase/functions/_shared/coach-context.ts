import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Server-side context assembly for the Coach — every fetch below is
 * scoped by `userId`, which the caller (coach-chat/index.ts) always
 * derives from the verified JWT via supabase.auth.getUser(), NEVER from
 * request body input. Each source is independent and defensively
 * wrapped: one bad query (e.g. a shared table being briefly empty)
 * degrades that one source to "no data" rather than failing the whole
 * request.
 *
 * Token budget: a fixed ceiling (CONTEXT_TOKEN_BUDGET) keeps the system
 * prompt small and the per-message cost predictable, per the confirmed
 * product requirement. Token counts are estimated with a plain
 * chars/4 heuristic — this Edge Function has no tokenizer available and
 * doesn't need exact counts, only a conservative ceiling.
 */

export type ContextSource =
  | "polymarket_analyses"
  | "sport_analyses"
  | "trading_analyses"
  | "selected_today"
  | "smart_wallet"
  | "past_conversations";

export const CONTEXT_SOURCES: ContextSource[] = [
  "polymarket_analyses",
  "sport_analyses",
  "trading_analyses",
  "selected_today",
  "smart_wallet",
  "past_conversations",
];

export function isContextSource(value: unknown): value is ContextSource {
  return typeof value === "string" && (CONTEXT_SOURCES as string[]).includes(value);
}

/** ~6000 tokens ≈ 24,000 characters at the 4-chars/token heuristic used
 * throughout this module — enough for a genuinely useful context window
 * without letting one message's input cost run away. */
export const CONTEXT_TOKEN_BUDGET = 6000;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export type ContextBlock = {
  source: ContextSource;
  /** Human-readable label for the "sources used" indicator in the UI. */
  label: string;
  text: string;
  itemCount: number;
};

type Budget = { remaining: number };

/** Appends `lines` one at a time while the budget allows it — stops
 * mid-source rather than either skipping the whole source or blowing the
 * budget, so the richest sources (usually the most recent items) are
 * never silently dropped first just because they're listed first. */
function takeWithinBudget(lines: string[], budget: Budget): string[] {
  const kept: string[] = [];
  for (const line of lines) {
    const cost = estimateTokens(line);
    if (cost > budget.remaining) break;
    kept.push(line);
    budget.remaining -= cost;
  }
  return kept;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

type SupabaseLike = ReturnType<typeof createClient>;

async function fetchPolymarketAnalyses(supabase: SupabaseLike, userId: string, budget: Budget) {
  const { data } = await supabase
    .from("analyses")
    .select(
      "question, category, decision, ai_probability, market_probability, edge, confidence, resolved, resolved_outcome, resolved_correct, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(15);

  const lines = (data ?? []).map((row: Record<string, unknown>) => {
    const resolvedNote =
      row.resolved && row.resolved_outcome
        ? ` — résultat réel: ${row.resolved_outcome} (prédiction ${row.resolved_correct ? "correcte" : "incorrecte"})`
        : "";
    return `- [${row.category}] "${row.question}" — IA: ${row.decision} ${row.ai_probability}% (marché ${row.market_probability}%, edge ${Number(row.edge) >= 0 ? "+" : ""}${row.edge}%) — confiance ${row.confidence} — ${fmtDate(row.created_at as string)}${resolvedNote}`;
  });

  return takeWithinBudget(lines, budget);
}

async function fetchSportAnalyses(supabase: SupabaseLike, userId: string, budget: Budget) {
  const { data } = await supabase
    .from("sports_bet_analyses")
    .select(
      "sport, participants, bet_type, selection, ai_probability, bookmaker_implied_probability, edge, confidence, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(15);

  const lines = (data ?? []).map(
    (row: Record<string, unknown>) =>
      `- [${row.sport}] ${row.participants} — ${row.bet_type}: ${row.selection} — IA: ${row.ai_probability}% (bookmaker ${row.bookmaker_implied_probability}%, edge ${Number(row.edge) >= 0 ? "+" : ""}${row.edge}%) — confiance ${row.confidence} — ${fmtDate(row.created_at as string)}`
  );

  return takeWithinBudget(lines, budget);
}

async function fetchTradingAnalyses(supabase: SupabaseLike, userId: string, budget: Budget) {
  const { data } = await supabase
    .from("trading_chart_analyses")
    .select("instrument, timeframe, recommendation, confidence, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(15);

  const lines = (data ?? []).map(
    (row: Record<string, unknown>) =>
      `- [${row.instrument ?? "instrument non identifié"}${row.timeframe ? ` / ${row.timeframe}` : ""}] recommandation: ${row.recommendation} — confiance ${row.confidence} — ${fmtDate(row.created_at as string)}`
  );

  return takeWithinBudget(lines, budget);
}

/** Shared/global "sélection du jour" pools — not scoped by user_id (same
 * tables the 3 Sélectionnés dashboard pages read), so every user sees the
 * same current picks here. */
async function fetchSelectedToday(supabase: SupabaseLike, _userId: string, budget: Budget) {
  const [markets, sportMatches, tradingPicks] = await Promise.all([
    supabase
      .from("selected_markets")
      .select("question, category, decision, ai_probability, market_probability")
      .order("scanned_at", { ascending: false })
      .limit(6),
    supabase
      .from("selected_sport_matches")
      .select("sport, home_team_name, away_team_name, predicted_winner, ai_probability, confidence")
      .order("scanned_at", { ascending: false })
      .limit(6),
    supabase
      .from("selected_trading_analyses")
      .select("display_symbol, timeframe, recommendation, confidence")
      .order("scanned_at", { ascending: false })
      .limit(6),
  ]);

  const lines: string[] = [];
  for (const row of markets.data ?? []) {
    lines.push(
      `- [Marché sélectionné] "${row.question}" (${row.category}) — IA: ${row.decision} ${row.ai_probability}% (marché ${row.market_probability}%)`
    );
  }
  for (const row of sportMatches.data ?? []) {
    lines.push(
      `- [Sport sélectionné] ${row.home_team_name} vs ${row.away_team_name} — IA: ${row.predicted_winner} ${row.ai_probability}% — confiance ${row.confidence}`
    );
  }
  for (const row of tradingPicks.data ?? []) {
    lines.push(
      `- [Trading sélectionné] ${row.display_symbol} (${row.timeframe}) — recommandation: ${row.recommendation} — confiance ${row.confidence}`
    );
  }

  return takeWithinBudget(lines, budget);
}

async function fetchSmartWallet(supabase: SupabaseLike, userId: string, budget: Budget) {
  const { data: follows } = await supabase
    .from("user_wallet_follows")
    .select("wallet_id")
    .eq("user_id", userId);

  const walletIds = (follows ?? []).map((f: Record<string, unknown>) => f.wallet_id as string);
  if (walletIds.length === 0) return [];

  const { data: wallets } = await supabase
    .from("tracked_wallets")
    .select("label, total_value, change_percent, active_positions_count, recent_movements")
    .in("id", walletIds)
    .limit(10);

  const lines = (wallets ?? []).map((row: Record<string, unknown>) => {
    const movements = Array.isArray(row.recent_movements) ? row.recent_movements.slice(0, 2) : [];
    const movementsNote = movements.length
      ? ` — mouvements récents: ${movements
          .map((m: Record<string, unknown>) => m.description ?? m.type ?? "mouvement")
          .join("; ")}`
      : "";
    return `- Portefeuille "${row.label}" — valeur ${row.total_value} (${Number(row.change_percent) >= 0 ? "+" : ""}${row.change_percent}%), ${row.active_positions_count} position(s) active(s)${movementsNote}`;
  });

  return takeWithinBudget(lines, budget);
}

async function fetchPastConversations(
  supabase: SupabaseLike,
  userId: string,
  currentConversationId: string | null,
  budget: Budget
) {
  let query = supabase
    .from("coach_conversations")
    .select("id, title, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(8);
  if (currentConversationId) {
    query = query.neq("id", currentConversationId);
  }
  const { data } = await query;

  const lines = (data ?? []).map(
    (row: Record<string, unknown>) =>
      `- "${row.title}" — ${fmtDate(row.updated_at as string)}`
  );

  return takeWithinBudget(lines, budget);
}

const SOURCE_LABELS: Record<ContextSource, string> = {
  polymarket_analyses: "Analyses Polymarket",
  sport_analyses: "Analyses Sport",
  trading_analyses: "Analyses Trading",
  selected_today: "Sélectionnés du jour",
  smart_wallet: "Smart Wallet",
  past_conversations: "Conversations précédentes",
};

/** One-time reminder injected whenever Sport or Trading context is
 * enabled — these two tables have no resolved/outcome tracking (unlike
 * Polymarket's `analyses`), so the model must never fabricate a success
 * rate for them. See the product decision this mirrors in
 * coach-chat/index.ts's system prompt. */
export const NO_RESOLUTION_DATA_NOTE =
  "Aucune donnée de résultat réel (gagné/perdu) n'existe pour les analyses Sport et Trading — ne jamais inventer, estimer ou laisser penser qu'un taux de réussite existe pour ces deux domaines. Dis-le explicitement si l'utilisateur le demande.";

export async function assembleContext(
  supabase: SupabaseLike,
  userId: string,
  enabledSources: ContextSource[],
  currentConversationId: string | null
): Promise<{ blocks: ContextBlock[]; sourcesUsed: ContextSource[] }> {
  const budget: Budget = { remaining: CONTEXT_TOKEN_BUDGET };
  const blocks: ContextBlock[] = [];

  const fetchers: Record<ContextSource, () => Promise<string[]>> = {
    polymarket_analyses: () => fetchPolymarketAnalyses(supabase, userId, budget),
    sport_analyses: () => fetchSportAnalyses(supabase, userId, budget),
    trading_analyses: () => fetchTradingAnalyses(supabase, userId, budget),
    selected_today: () => fetchSelectedToday(supabase, userId, budget),
    smart_wallet: () => fetchSmartWallet(supabase, userId, budget),
    past_conversations: () => fetchPastConversations(supabase, userId, currentConversationId, budget),
  };

  // Fixed priority order (not the caller's array order) so the budget is
  // always spent on the most consistently useful sources first.
  for (const source of CONTEXT_SOURCES) {
    if (!enabledSources.includes(source)) continue;
    if (budget.remaining <= 0) break;

    let lines: string[] = [];
    try {
      lines = await fetchers[source]();
    } catch (error) {
      console.error(`[coach-context] failed to fetch "${source}"`, error);
      continue;
    }
    if (lines.length === 0) continue;

    blocks.push({ source, label: SOURCE_LABELS[source], text: lines.join("\n"), itemCount: lines.length });
  }

  return { blocks, sourcesUsed: blocks.map((b) => b.source) };
}
