import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { fetchMarketBySlug, MarketNotFoundError } from "../analyze-market/gamma.ts";
import {
  fetchWalletActivity,
  fetchWalletPositions,
  fetchWalletValue,
  WALLET_ADDRESS_RE,
  type WalletMovement,
  type WalletPosition,
} from "./polymarket-data.ts";

/**
 * Smart Wallet here means "watch + notify," never automatic execution or
 * discovery — this function (1) refreshes every wallet at least one user
 * currently follows (tracked_wallets rows are only ever created by the
 * /api/wallets/follow route now — see that route's own comment — so this
 * is effectively "every wallet a user has added"), and (2) notifies every
 * follower of a fresh movement on a wallet they follow, with a link to the
 * real Polymarket market. No leaderboard-based auto-discovery, and no
 * copy-trading decision/strategy pipeline — both were removed; see this
 * function's git history if either needs reviving.
 */

/** How many recent trades to fetch per wallet — powers the "mouvements
 * récents" list shown in the wallet-lookup panel and the fresh-movement
 * detection below. */
const ACTIVITY_FETCH_LIMIT = 20;

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

/** Resolves a market slug (as seen in wallet activity's marketSlug field)
 * to its Gamma category, via a cache shared across the whole refresh pass
 * so the same hot market isn't looked up once per wallet that traded it.
 * Never throws — an unresolvable slug just doesn't contribute a category,
 * same defensive posture as the rest of this module. */
async function resolveCategory(
  slug: string,
  cache: Map<string, string | null>,
  budget: { remaining: number }
): Promise<string | null> {
  if (cache.has(slug)) return cache.get(slug)!;
  if (budget.remaining <= 0) return null;
  budget.remaining--;
  try {
    const resolution = await fetchMarketBySlug(slug, null);
    const category = resolution.kind === "single" ? (resolution.market.category ?? null) : null;
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

const HIGH_RISK_CONCENTRATION_RATIO = 0.15;
const MEDIUM_RISK_CONCENTRATION_RATIO = 0.05;

function classifyRiskLevel(avgPositionSize: number, totalValue: number): "low" | "medium" | "high" {
  if (totalValue <= 0) return "medium";
  const ratio = avgPositionSize / totalValue;
  if (ratio >= HIGH_RISK_CONCENTRATION_RATIO) return "high";
  if (ratio >= MEDIUM_RISK_CONCENTRATION_RATIO) return "medium";
  return "low";
}

/** 0-100: how tightly a wallet's position P&L clusters around its own
 * average rather than swinging wildly — a coefficient-of-variation on
 * position P&L, inverted and clamped. An original heuristic (no
 * Polymarket equivalent exists); neutral (50) when there isn't enough data
 * to measure variance from. */
function computeConsistencyScore(positions: WalletPosition[]): number {
  if (positions.length < 2) return 50;
  const pnls = positions.map((p) => p.pnl);
  const mean = pnls.reduce((sum, v) => sum + v, 0) / pnls.length;
  const variance = pnls.reduce((sum, v) => sum + (v - mean) ** 2, 0) / pnls.length;
  const stdev = Math.sqrt(variance);
  const coefficientOfVariation = stdev / (Math.abs(mean) + 1);
  return Math.round(Math.max(0, Math.min(100, 100 - coefficientOfVariation * 25)));
}

/** Hard cap on distinct market→category Gamma lookups spent computing
 * category diversity across the *whole tracked pool* in one refresh pass
 * — the same hot market can show up in many wallets' recent trades, so
 * this rarely actually gets hit in practice, but bounds the worst case
 * regardless of pool size. */
const MAX_REFRESH_CATEGORY_LOOKUPS_PER_RUN = 80;

type WalletQuality = {
  winRate: number;
  totalPnl: number;
  roiPercent: number | null;
  avgPositionSize: number;
  riskLevel: "low" | "medium" | "high";
  consistencyScore: number;
  categoryDiversity: number;
};

async function computeWalletQuality(
  positions: WalletPosition[],
  activity: WalletMovement[],
  totalValue: number,
  categoryCache: Map<string, string | null>,
  categoryBudget: { remaining: number }
): Promise<WalletQuality> {
  const { winRate, totalPnl } = winRateAndPnl(positions);
  const avgPositionSize =
    positions.length > 0
      ? positions.reduce((sum, p) => sum + p.amount, 0) / positions.length
      : 0;
  const roiPercent = totalValue > 0 ? (totalPnl / totalValue) * 100 : null;

  const slugs = Array.from(
    new Set(activity.map((m) => m.marketSlug).filter((s): s is string => !!s))
  );
  const categories = new Set<string>();
  for (const slug of slugs) {
    const category = await resolveCategory(slug, categoryCache, categoryBudget);
    if (category) categories.add(category);
  }

  return {
    winRate,
    totalPnl,
    roiPercent,
    avgPositionSize,
    riskLevel: classifyRiskLevel(avgPositionSize, totalValue),
    consistencyScore: computeConsistencyScore(positions),
    categoryDiversity: categories.size,
  };
}

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

  // --- 1. Refresh every wallet at least one user follows -------------------
  // tracked_wallets rows only ever exist because a user added/followed
  // that address (see /api/wallets/follow) — but a wallet can be unfollowed
  // by everyone and left behind, so this still explicitly scopes to
  // user_wallet_follows rather than assuming every tracked_wallets row is
  // live, keeping the refresh cost tied to actual usage.
  const { data: followRows, error: followRowsError } = await supabase
    .from("user_wallet_follows")
    .select("user_id, wallet_id");

  if (followRowsError) {
    console.error("[sync-smart-money] failed to load wallet follows", followRowsError);
    return new Response(
      JSON.stringify({ error: "db_error", message: "Impossible de charger les wallets suivis." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const followedWalletIds = Array.from(new Set((followRows ?? []).map((f) => f.wallet_id as string)));

  const { data: wallets, error: walletsError } =
    followedWalletIds.length > 0
      ? await supabase
          .from("tracked_wallets")
          .select("id, address, label, last_synced_at, created_at")
          .in("id", followedWalletIds)
      : { data: [], error: null };

  if (walletsError) {
    console.error("[sync-smart-money] failed to load tracked wallets", walletsError);
    return new Response(
      JSON.stringify({ error: "db_error", message: "Impossible de charger les portefeuilles suivis." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Shared across the whole refresh pass — every tracked wallet's category
  // diversity is computed this run, but Gamma lookups stay bounded
  // regardless of pool size.
  const refreshCategoryCache = new Map<string, string | null>();
  const refreshCategoryBudget = { remaining: MAX_REFRESH_CATEGORY_LOOKUPS_PER_RUN };

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

    const quality = await computeWalletQuality(
      positions,
      activity,
      value,
      refreshCategoryCache,
      refreshCategoryBudget
    );
    const trackRecordDays = wallet.created_at
      ? Math.max(
          0,
          Math.floor((Date.now() - new Date(wallet.created_at as string).getTime()) / 86_400_000)
        )
      : null;

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
        win_rate: quality.winRate,
        roi_percent: quality.roiPercent,
        consistency_score: quality.consistencyScore,
        category_diversity: quality.categoryDiversity,
        avg_position_size: quality.avgPositionSize,
        risk_level: quality.riskLevel,
        track_record_days: trackRecordDays,
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
      // "since last check" window — skip notification generation for it so
      // we don't backfill days/weeks of history as a flood of "new"
      // notifications on day one.
      previousSyncedAt,
    };
  });

  const refreshedById = new Map(refreshed.filter((r) => r.ok).map((r) => [r.walletId, r]));
  const walletById = new Map((wallets ?? []).map((w) => [w.id, w]));

  const freshMovementsByWalletId = new Map<string, WalletMovement[]>();
  for (const state of refreshedById.values()) {
    if (!state.previousSyncedAt) continue;
    const sinceCutoff = new Date(state.previousSyncedAt).getTime();
    const fresh = (state.activity as WalletMovement[]).filter(
      (m) => new Date(m.timestamp).getTime() > sinceCutoff
    );
    if (fresh.length > 0) freshMovementsByWalletId.set(state.walletId, fresh);
  }

  // --- 2. Notify every follower of a followed wallet's fresh movements ----
  // A plain "Suivre" with zero configuration gets a notification on every
  // new trade — see wallet_follow_notifications for the (user, wallet,
  // tx_hash) dedupe that keeps a rerun from double-notifying.
  let followNotificationsCreated = 0;
  for (const follow of followRows ?? []) {
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

  const summary = {
    trackedWallets: wallets?.length ?? 0,
    refreshed: refreshed.filter((r) => r.ok).length,
    refreshFailed: refreshed.filter((r) => !r.ok).length,
    followNotificationsCreated,
  };
  console.log("[sync-smart-money] run complete", summary);

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
