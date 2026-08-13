import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { listCandidateMarkets, GammaUnavailableError } from "../analyze-market/gamma.ts";
import {
  fetchWalletActivity,
  fetchWalletPositions,
  fetchWalletValue,
  fetchMarketHolders,
  WALLET_ADDRESS_RE,
  type WalletMovement,
} from "./polymarket-data.ts";

/**
 * Copy trading here means "watch + alert", never automatic execution —
 * see the copy_trading_suggestions table comment and the in-app tutorial.
 * This function (1) tops up the tracked_wallets pool by discovering active
 * wallets from currently-hot markets when the pool is thin, (2) refreshes
 * every tracked wallet's value/positions/activity, and (3) checks each
 * active copy-trading strategy's fresh movements against its risk
 * parameters, creating a suggestion + notification when one qualifies.
 */

/** Below this many tracked wallets, spend part of the run discovering more
 * instead of only refreshing the existing pool. */
const MIN_TRACKED_WALLETS_POOL = 12;
/** Cap on newly-discovered wallets per run — keeps a single run's Data API
 * call volume bounded. */
const MAX_NEW_WALLETS_PER_RUN = 8;
/** Only wallets holding at least this much are considered "smart money"
 * worth tracking by default. */
const MIN_DISCOVERY_WALLET_VALUE_USD = 10000;
/** How many of the highest-volume current markets to pull holders from
 * when discovering new wallets. */
const DISCOVERY_MARKETS_TO_SCAN = 5;
const HOLDERS_PER_MARKET = 10;
/** How many recent trades to fetch per wallet — powers both the
 * "mouvements récents" list and the copy-trading suggestion check. */
const ACTIVITY_FETCH_LIMIT = 20;
/** max_simultaneous_positions is enforced as a cap on suggestions created
 * within this trailing window, since there's no real "closed position"
 * concept without an executed trade. */
const SUGGESTION_LOOKBACK_DAYS = 14;

const currencyFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
function formatEUR(value: number): string {
  return `${currencyFormatter.format(value)} €`;
}

function shortLabel(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(
      JSON.stringify({
        error: "unauthorized",
        message: "Cette fonction ne peut être déclenchée qu'avec la clé service role.",
      }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

  // --- 1. Discovery: top up the tracked pool if it's thin -----------------
  const { count: trackedCount } = await supabase
    .from("tracked_wallets")
    .select("id", { count: "exact", head: true });

  let discovered = 0;
  if ((trackedCount ?? 0) < MIN_TRACKED_WALLETS_POOL) {
    try {
      const candidateMarkets = (await listCandidateMarkets(30))
        .filter((m) => m.conditionId)
        .slice(0, DISCOVERY_MARKETS_TO_SCAN);

      const { data: existingRows } = await supabase.from("tracked_wallets").select("address");
      const existingAddresses = new Set(
        (existingRows ?? []).map((r) => String(r.address).toLowerCase())
      );

      const holderSets = await mapWithConcurrency(candidateMarkets, 3, (market) =>
        fetchMarketHolders(market.conditionId!, HOLDERS_PER_MARKET)
      );
      const candidateAddresses = Array.from(new Set(holderSets.flat())).filter(
        (a) => !existingAddresses.has(a)
      );

      const evaluated = await mapWithConcurrency(candidateAddresses, 5, async (address) => ({
        address,
        value: await fetchWalletValue(address),
      }));

      const qualifying = evaluated
        .filter((w) => w.value >= MIN_DISCOVERY_WALLET_VALUE_USD)
        .sort((a, b) => b.value - a.value)
        .slice(0, MAX_NEW_WALLETS_PER_RUN);

      for (const w of qualifying) {
        const { error } = await supabase.from("tracked_wallets").insert({
          address: w.address,
          label: shortLabel(w.address),
          source: "discovered",
          total_value: w.value,
        });
        if (!error) discovered++;
      }
    } catch (error) {
      console.error(
        "[sync-smart-money] discovery failed",
        error instanceof GammaUnavailableError ? error.message : error
      );
    }
  }

  // --- 2. Refresh every tracked wallet -------------------------------------
  const { data: wallets, error: walletsError } = await supabase
    .from("tracked_wallets")
    .select("id, address, total_value, last_synced_at");

  if (walletsError) {
    console.error("[sync-smart-money] failed to load tracked wallets", walletsError);
    return new Response(
      JSON.stringify({ error: "db_error", message: "Impossible de charger les portefeuilles suivis." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const refreshed = await mapWithConcurrency(wallets ?? [], 5, async (wallet) => {
    const address = String(wallet.address).match(WALLET_ADDRESS_RE) ? wallet.address : null;
    if (!address) return { walletId: wallet.id, ok: false as const };

    const previousValue = Number(wallet.total_value ?? 0);
    const previousSyncedAt = wallet.last_synced_at as string | null;

    const [value, positions, activity] = await Promise.all([
      fetchWalletValue(address),
      fetchWalletPositions(address),
      fetchWalletActivity(address, ACTIVITY_FETCH_LIMIT),
    ]);

    const changePercent =
      previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;
    const distinctMarkets = new Set(positions.map((p) => p.market)).size;
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("tracked_wallets")
      .update({
        total_value: value,
        change_percent: changePercent,
        active_positions_count: positions.length,
        markets_tracked_count: distinctMarkets,
        positions,
        recent_movements: activity,
        last_synced_at: now,
      })
      .eq("id", wallet.id);

    if (updateError) {
      console.error(`[sync-smart-money] failed to update wallet ${wallet.id}`, updateError);
      return { walletId: wallet.id, ok: false as const };
    }

    const { error: snapshotError } = await supabase
      .from("wallet_snapshots")
      .insert({ wallet_id: wallet.id, total_value: value });
    if (snapshotError) {
      console.error(`[sync-smart-money] failed to insert snapshot for ${wallet.id}`, snapshotError);
    }

    return {
      walletId: wallet.id,
      ok: true as const,
      value,
      activity,
      // A wallet synced for the first time this run has no meaningful
      // "since last check" window — skip suggestion generation for it so
      // we don't backfill days/weeks of history as a flood of "new"
      // notifications on day one.
      previousSyncedAt,
    };
  });

  // --- 3. Check active copy-trading strategies for qualifying movements ---
  const { data: strategies, error: strategiesError } = await supabase
    .from("copy_trading_strategies")
    .select(
      "id, user_id, wallet_id, max_position_amount, max_exposure_percent, max_simultaneous_positions"
    )
    .eq("status", "active");

  if (strategiesError) {
    console.error("[sync-smart-money] failed to load strategies", strategiesError);
  }

  let suggestionsCreated = 0;
  const refreshedById = new Map(refreshed.filter((r) => r.ok).map((r) => [r.walletId, r]));
  const walletById = new Map((wallets ?? []).map((w) => [w.id, w]));

  for (const strategy of strategies ?? []) {
    const walletState = refreshedById.get(strategy.wallet_id);
    const walletRow = walletById.get(strategy.wallet_id);
    if (!walletState || !walletState.ok || !walletState.previousSyncedAt || !walletRow) continue;

    const sinceCutoff = new Date(walletState.previousSyncedAt).getTime();
    const freshMovements = (walletState.activity as WalletMovement[]).filter(
      (m) => new Date(m.timestamp).getTime() > sinceCutoff
    );
    if (freshMovements.length === 0) continue;

    const lookbackCutoff = new Date(
      Date.now() - SUGGESTION_LOOKBACK_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();
    const { count: recentSuggestionCount } = await supabase
      .from("copy_trading_suggestions")
      .select("id", { count: "exact", head: true })
      .eq("strategy_id", strategy.id)
      .gte("created_at", lookbackCutoff);

    let slotsAvailable = Math.max(
      0,
      Number(strategy.max_simultaneous_positions) - (recentSuggestionCount ?? 0)
    );
    if (slotsAvailable === 0) continue;

    const walletLabel = String(walletRow.label ?? shortLabel(walletRow.address));
    const walletValue = Number(walletState.value) || 1;

    for (const movement of freshMovements) {
      if (slotsAvailable <= 0) break;
      if (movement.amount > Number(strategy.max_position_amount)) continue;
      const exposurePercent = (movement.amount / walletValue) * 100;
      if (exposurePercent > Number(strategy.max_exposure_percent)) continue;

      const marketUrl = movement.marketSlug
        ? `https://polymarket.com/event/${movement.marketSlug}`
        : `https://polymarket.com/profile/${walletRow.address}`;

      const { data: insertedSuggestion, error: suggestionError } = await supabase
        .from("copy_trading_suggestions")
        .insert({
          strategy_id: strategy.id,
          user_id: strategy.user_id,
          wallet_id: strategy.wallet_id,
          market_question: movement.market,
          market_url: marketUrl,
          side: movement.side,
          amount: movement.amount,
          tx_hash: movement.txHash,
        })
        .select("id")
        .single();

      // A conflict on (strategy_id, tx_hash) means this movement was
      // already turned into a suggestion in a prior run — not an error.
      if (suggestionError || !insertedSuggestion) continue;

      const { data: insertedNotification, error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: strategy.user_id,
          title: `Nouveau mouvement suivi — ${walletLabel}`,
          description: `${movement.type} ${movement.side} sur "${movement.market}" pour ${formatEUR(
            movement.amount
          )}. Cliquez pour l'exécuter vous-même sur Polymarket si vous le souhaitez.`,
          link_url: marketUrl,
        })
        .select("id")
        .single();

      if (!notificationError && insertedNotification) {
        await supabase
          .from("copy_trading_suggestions")
          .update({ notification_id: insertedNotification.id })
          .eq("id", insertedSuggestion.id);
      }

      suggestionsCreated++;
      slotsAvailable--;
    }
  }

  const summary = {
    trackedWallets: wallets?.length ?? 0,
    discovered,
    refreshed: refreshed.filter((r) => r.ok).length,
    refreshFailed: refreshed.filter((r) => !r.ok).length,
    suggestionsCreated,
  };
  console.log("[sync-smart-money] run complete", summary);

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
