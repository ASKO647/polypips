import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  listCandidateMarkets,
  fetchMarketBySlug,
  GammaUnavailableError,
  MarketNotFoundError,
} from "../analyze-market/gamma.ts";
import {
  fetchWalletActivity,
  fetchWalletPositions,
  fetchWalletValue,
  fetchMarketHolders,
  WALLET_ADDRESS_RE,
  type WalletMovement,
  type WalletPosition,
} from "./polymarket-data.ts";

/**
 * Copy trading here means "watch + alert", never automatic execution —
 * see the copy_trading_suggestions table comment and the in-app tutorial.
 * This function (1) tops up the tracked_wallets pool by discovering wallets
 * that trade daily, are profitable more often than not, and bet across
 * several market categories (a composite score, not "biggest wallet by
 * value" — see scoreCandidate below) when the pool is thin, (2) refreshes
 * every tracked wallet's value/positions/activity, and (3) notifies every
 * user following a wallet (no strategy required) on each fresh movement,
 * and separately checks each active copy-trading strategy's fresh
 * movements against its own risk parameters for suggestions.
 */

/** Below this many tracked wallets, spend part of the run discovering more
 * instead of only refreshing the existing pool. */
const MIN_TRACKED_WALLETS_POOL = 12;
/** Cap on newly-discovered wallets per run — keeps a single run's Data API
 * call volume bounded. */
const MAX_NEW_WALLETS_PER_RUN = 8;
/** Sanity floor only — no longer the ranking criterion (see scoreCandidate).
 * Filters out true dust/bot addresses that technically hold a position but
 * aren't real traders, nothing more. */
const MIN_DISCOVERY_WALLET_VALUE_USD = 1000;
/** How many of the highest-volume current markets to pull holders from
 * when discovering new wallets. */
const DISCOVERY_MARKETS_TO_SCAN = 5;
const HOLDERS_PER_MARKET = 10;
/** How many recent trades to fetch per wallet — powers both the
 * "mouvements récents" list and the copy-trading suggestion check. */
const ACTIVITY_FETCH_LIMIT = 20;

// --- Discovery scoring: "daily activity + profitable more often than not +
// multi-category" instead of "biggest wallet by value." ---------------------

/** Window used to judge whether a candidate trades "daily" and to compute
 * its recent win rate / P&L — long enough to smooth over a quiet day or
 * two, short enough that a wallet that's gone dormant doesn't still read
 * as active. */
const DISCOVERY_LOOKBACK_DAYS = 14;
/** Fetch a longer activity window than the normal refresh does — need
 * enough trades to actually count distinct trading days over
 * DISCOVERY_LOOKBACK_DAYS, not just the last handful of moves. */
const DISCOVERY_ACTIVITY_FETCH_LIMIT = 50;
/** Hard gate: fewer distinct trading days than this and a candidate is
 * disqualified outright, no matter how good its other numbers look — "bets
 * daily" is interpreted as "trades on a clear majority of days," not
 * literally 14/14, which would exclude any real trader who ever takes a day
 * off. Tune this directly if the intended bar is stricter or looser. */
const MIN_DISTINCT_TRADING_DAYS = 5;
/** Hard gate: fewer distinct categories among a candidate's recent trades
 * than this and it's disqualified — "bets in several categories," not "one
 * category, repeatedly." */
const MIN_DISTINCT_CATEGORIES = 2;
/** Cheap first pass (value + activity, no Gamma calls yet) narrows the raw
 * holder pool down to this many before the expensive second pass
 * (positions for win rate/P&L, Gamma lookups for category) runs — keeps a
 * single run's Data API + Gamma call volume bounded regardless of how many
 * raw holder addresses the discovery markets turn up. */
const DISCOVERY_SHORTLIST_SIZE = 20;
/** Hard cap on distinct market→category Gamma lookups in one run — a
 * shortlist of 20 wallets could otherwise reference 100+ distinct markets
 * between them. Lookups are shared via a single cache across the whole
 * shortlist (the same hot market shows up in many wallets' recent trades),
 * so this rarely actually gets hit in practice. */
const MAX_CATEGORY_LOOKUPS_PER_RUN = 60;

/** Composite score weights — daily activity, profitability (win rate +
 * P&L), and category diversity are each meant to matter, with
 * profitability split so a wallet's *consistency* (win rate) counts for
 * more than the raw size of its P&L (one lucky whale trade shouldn't
 * outweigh a wallet that wins most of the time). Sums to 1.0. */
const WEIGHT_ACTIVITY = 0.35;
const WEIGHT_WIN_RATE = 0.25;
const WEIGHT_PNL = 0.15;
const WEIGHT_DIVERSITY = 0.25;

type ScoredCandidate = {
  address: string;
  value: number;
  distinctTradingDays: number;
  winRate: number;
  totalPnl: number;
  distinctCategories: number;
  score: number;
};

function distinctTradingDays(activity: WalletMovement[], lookbackDays: number): number {
  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
  const days = new Set(
    activity
      .filter((m) => new Date(m.timestamp).getTime() >= cutoff)
      .map((m) => new Date(m.timestamp).toISOString().slice(0, 10))
  );
  return days.size;
}

/** No open positions isn't evidence of being a bad trader (could just mean
 * everything's currently closed/resolved) — a neutral 0.5 avoids unfairly
 * zeroing out a candidate's win-rate score for that alone. */
function winRateAndPnl(positions: WalletPosition[]): { winRate: number; totalPnl: number } {
  if (positions.length === 0) return { winRate: 0.5, totalPnl: 0 };
  const winners = positions.filter((p) => p.pnl > 0).length;
  return {
    winRate: winners / positions.length,
    totalPnl: positions.reduce((sum, p) => sum + p.pnl, 0),
  };
}

/** Squashes P&L to 0..1 around a several-thousand-dollar scale (logistic)
 * so one outsized trade can't single-handedly dominate the score the way a
 * raw-dollar comparison would — this is "is it healthily positive," not a
 * leaderboard of absolute profit. */
function pnlScore(totalPnl: number): number {
  return 1 / (1 + Math.exp(-totalPnl / 5000));
}

function compositeScore(input: {
  distinctTradingDays: number;
  winRate: number;
  totalPnl: number;
  distinctCategories: number;
}): number {
  const activityScore = Math.min(1, input.distinctTradingDays / DISCOVERY_LOOKBACK_DAYS);
  const diversityScore = Math.min(1, input.distinctCategories / 4);
  return (
    WEIGHT_ACTIVITY * activityScore +
    WEIGHT_WIN_RATE * input.winRate +
    WEIGHT_PNL * pnlScore(input.totalPnl) +
    WEIGHT_DIVERSITY * diversityScore
  );
}

/** Resolves a market slug (as seen in wallet activity's marketSlug field)
 * to its Gamma category, via a cache shared across the whole discovery
 * pass so the same hot market isn't looked up once per wallet that traded
 * it. Never throws — an unresolvable slug just doesn't contribute a
 * category, same defensive posture as the rest of this module. */
async function resolveCategory(
  slug: string,
  cache: Map<string, string | null>,
  budget: { remaining: number }
): Promise<string | null> {
  if (cache.has(slug)) return cache.get(slug)!;
  if (budget.remaining <= 0) return null;
  budget.remaining--;
  try {
    const market = await fetchMarketBySlug(slug, null);
    const category = market.category ?? null;
    cache.set(slug, category);
    return category;
  } catch (error) {
    if (!(error instanceof MarketNotFoundError)) {
      console.error(`[sync-smart-money] category lookup failed for ${slug}`, error);
    }
    cache.set(slug, null);
    return null;
  }
}
/** max_simultaneous_positions is enforced as a cap on suggestions created
 * within this trailing window, since there's no real "closed position"
 * concept without an executed trade. */
const SUGGESTION_LOOKBACK_DAYS = 14;
/** change_percent is "evolution over roughly a day," not "since the last
 * cron tick" — comparing against the immediately preceding sync makes the
 * number meaningless (and near-zero) once the cron runs every few minutes,
 * while the sign still flips on real noise. */
const CHANGE_REFERENCE_WINDOW_MS = 24 * 60 * 60 * 1000;

const currencyFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
function formatEUR(value: number): string {
  return `${currencyFormatter.format(value)} €`;
}

function shortLabel(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Finds the value to compare a wallet's fresh total against for
 * change_percent: the most recent snapshot at least ~24h old, or — if the
 * wallet doesn't have 24h of history yet — the oldest snapshot recorded so
 * far (some real reference beats none). Returns null when there isn't a
 * single prior snapshot, which the frontend renders as "no data yet"
 * rather than a fake "unchanged."
 */
async function fetchChangeReferenceValue(
  supabase: ReturnType<typeof createClient>,
  walletId: string
): Promise<number | null> {
  const { data: snapshots, error } = await supabase
    .from("wallet_snapshots")
    .select("total_value, snapshotted_at")
    .eq("wallet_id", walletId)
    .order("snapshotted_at", { ascending: true });

  if (error || !snapshots || snapshots.length === 0) return null;

  const cutoff = Date.now() - CHANGE_REFERENCE_WINDOW_MS;
  for (let i = snapshots.length - 1; i >= 0; i--) {
    if (new Date(snapshots[i].snapshotted_at).getTime() <= cutoff) {
      return Number(snapshots[i].total_value);
    }
  }
  // No snapshot is old enough yet — fall back to the earliest one available.
  return Number(snapshots[0].total_value);
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

      // Pass 1 (cheap): value + activity only, no Gamma calls yet. Narrows
      // the raw holder pool — which can be dozens of addresses — down to a
      // bounded shortlist before the expensive per-candidate work
      // (positions for win rate/P&L, Gamma category lookups) runs.
      const cheapEvaluated = await mapWithConcurrency(candidateAddresses, 5, async (address) => {
        const [value, activity] = await Promise.all([
          fetchWalletValue(address),
          fetchWalletActivity(address, DISCOVERY_ACTIVITY_FETCH_LIMIT),
        ]);
        return { address, value, activity };
      });

      const shortlist = cheapEvaluated
        .filter((w) => w.value >= MIN_DISCOVERY_WALLET_VALUE_USD)
        .map((w) => ({ ...w, tradingDays: distinctTradingDays(w.activity, DISCOVERY_LOOKBACK_DAYS) }))
        .filter((w) => w.tradingDays >= MIN_DISTINCT_TRADING_DAYS)
        .sort((a, b) => b.tradingDays - a.tradingDays)
        .slice(0, DISCOVERY_SHORTLIST_SIZE);

      // Pass 2 (expensive): positions for win rate/P&L, and category
      // lookups for every distinct market slug the shortlist traded
      // recently — shared through one cache + one shrinking budget across
      // the whole shortlist rather than per-wallet.
      const categoryCache = new Map<string, string | null>();
      const categoryBudget = { remaining: MAX_CATEGORY_LOOKUPS_PER_RUN };

      const scored: ScoredCandidate[] = await mapWithConcurrency(shortlist, 5, async (w) => {
        const positions = await fetchWalletPositions(w.address);
        const { winRate, totalPnl } = winRateAndPnl(positions);

        const slugs = Array.from(
          new Set(w.activity.map((m) => m.marketSlug).filter((s): s is string => !!s))
        );
        const categories = new Set<string>();
        for (const slug of slugs) {
          const category = await resolveCategory(slug, categoryCache, categoryBudget);
          if (category) categories.add(category);
        }

        return {
          address: w.address,
          value: w.value,
          distinctTradingDays: w.tradingDays,
          winRate,
          totalPnl,
          distinctCategories: categories.size,
          score: compositeScore({
            distinctTradingDays: w.tradingDays,
            winRate,
            totalPnl,
            distinctCategories: categories.size,
          }),
        };
      });

      const qualifying = scored
        .filter((w) => w.distinctCategories >= MIN_DISTINCT_CATEGORIES)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_NEW_WALLETS_PER_RUN);

      console.log(
        "[sync-smart-money] discovery scoring",
        scored
          .sort((a, b) => b.score - a.score)
          .map((w) => ({
            address: w.address,
            score: Number(w.score.toFixed(3)),
            tradingDays: w.distinctTradingDays,
            winRate: Number(w.winRate.toFixed(2)),
            totalPnl: Math.round(w.totalPnl),
            categories: w.distinctCategories,
            qualifies: w.distinctCategories >= MIN_DISTINCT_CATEGORIES,
          }))
      );

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
    .select("id, address, label, last_synced_at");

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

    const previousSyncedAt = wallet.last_synced_at as string | null;

    const [value, positions, activity, referenceValue] = await Promise.all([
      fetchWalletValue(address),
      fetchWalletPositions(address),
      fetchWalletActivity(address, ACTIVITY_FETCH_LIMIT),
      fetchChangeReferenceValue(supabase, wallet.id),
    ]);

    // null (not 0) when there's no real historical data point yet to
    // compare against — the frontend renders that as a neutral state
    // instead of a false "unchanged" reading.
    const changePercent =
      referenceValue !== null && referenceValue > 0
        ? ((value - referenceValue) / referenceValue) * 100
        : null;
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

  const refreshedById = new Map(refreshed.filter((r) => r.ok).map((r) => [r.walletId, r]));
  const walletById = new Map((wallets ?? []).map((w) => [w.id, w]));

  // Computed once, shared by both the follow-notification pass below and
  // the copy-trading suggestion pass after it — same "movements since this
  // wallet's previous sync" definition either way. A wallet synced for the
  // first time this run (no previousSyncedAt) has no meaningful "since
  // last check" window, so it contributes no fresh movements to either
  // pass — otherwise day one would backfill a flood of "new" notifications
  // for a wallet's entire history.
  const freshMovementsByWalletId = new Map<string, WalletMovement[]>();
  for (const state of refreshedById.values()) {
    if (!state.previousSyncedAt) continue;
    const sinceCutoff = new Date(state.previousSyncedAt).getTime();
    const fresh = (state.activity as WalletMovement[]).filter(
      (m) => new Date(m.timestamp).getTime() > sinceCutoff
    );
    if (fresh.length > 0) freshMovementsByWalletId.set(state.walletId, fresh);
  }

  // --- 3. Notify every follower of a followed wallet's fresh movements ----
  // Deliberately independent of Copy Trading: a plain "Suivre" with zero
  // configuration gets a notification on every new trade, no risk
  // parameters, no per-cycle cap — see wallet_follow_notifications for the
  // (user, wallet, tx_hash) dedupe that keeps a rerun from double-notifying.
  const { data: follows, error: followsError } = await supabase
    .from("user_wallet_follows")
    .select("user_id, wallet_id");

  if (followsError) {
    console.error("[sync-smart-money] failed to load wallet follows", followsError);
  }

  let followNotificationsCreated = 0;
  for (const follow of follows ?? []) {
    const freshMovements = freshMovementsByWalletId.get(follow.wallet_id);
    if (!freshMovements) continue;
    const walletRow = walletById.get(follow.wallet_id);
    if (!walletRow) continue;

    const walletLabel = String(walletRow.label ?? shortLabel(walletRow.address));

    for (const movement of freshMovements) {
      const marketUrl = movement.marketSlug
        ? `https://polymarket.com/event/${movement.marketSlug}`
        : `https://polymarket.com/profile/${walletRow.address}`;

      const { data: insertedFollowNotification, error: followNotifError } = await supabase
        .from("wallet_follow_notifications")
        .insert({
          user_id: follow.user_id,
          wallet_id: follow.wallet_id,
          tx_hash: movement.txHash,
        })
        .select("id")
        .single();

      // A conflict on (user_id, wallet_id, tx_hash) means this user was
      // already notified about this exact trade in a prior run — not an
      // error, just the dedupe doing its job.
      if (followNotifError || !insertedFollowNotification) continue;

      const { data: insertedNotification, error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: follow.user_id,
          title: `${walletLabel} vient de parier`,
          description: `${movement.type} ${movement.side} sur "${movement.market}" pour ${formatEUR(
            movement.amount
          )}.`,
          link_url: marketUrl,
        })
        .select("id")
        .single();

      if (!notificationError && insertedNotification) {
        await supabase
          .from("wallet_follow_notifications")
          .update({ notification_id: insertedNotification.id })
          .eq("id", insertedFollowNotification.id);
        followNotificationsCreated++;
      }
    }
  }

  // --- 4. Check active copy-trading strategies for qualifying movements ---
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

  for (const strategy of strategies ?? []) {
    const walletState = refreshedById.get(strategy.wallet_id);
    const walletRow = walletById.get(strategy.wallet_id);
    if (!walletState || !walletRow) continue;

    const freshMovements = freshMovementsByWalletId.get(strategy.wallet_id);
    if (!freshMovements) continue;

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
    followNotificationsCreated,
    suggestionsCreated,
  };
  console.log("[sync-smart-money] run complete", summary);

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
