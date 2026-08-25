import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getSignalProvider, ProviderNotImplementedError, type SignalSource } from "../_shared/signal-providers/index.ts";
import { computeSignalScore, computeWalletScore } from "./ai-engine.ts";
import { applyRiskEngine } from "./risk-engine.ts";

/**
 * Smart Wallets (Fomo/Axiom) sync — the whole pipeline described in the
 * brief in one job, mirroring how sync-smart-money already combines
 * discovery + sync + the Polymarket "Smart Copy" decision pipeline in one
 * function rather than several:
 *
 *   getSignalProvider() → discover/refresh wallets → detect new trades
 *   → AI Engine (ai-engine.ts) → Risk Engine (risk-engine.ts)
 *   → COPY/IGNORE → Execution Engine (demo only, below) → position
 *   lifecycle → notifications.
 *
 * getSignalProvider() defaults every source to MockSignalProvider — see
 * that module's file comment for why: neither Fomo nor Axiom expose a
 * documented public/commercial API today, and this project does not
 * scrape either. Every wallet/trade row this writes therefore carries
 * data_source_mode='mock', and the frontend always renders a
 * demonstration-data banner for it. The Execution Engine is equally
 * explicit: execution_mode is hardcoded to 'demo' below — there is no
 * code path that can write 'live' (no private keys are ever requested or
 * stored, and no wallet-signing/execution integration exists yet). A real
 * integration is a separate, later change to getSignalProvider() plus a
 * genuine LiveExecutionProvider, not a flag flip.
 */

const SOURCES: SignalSource[] = ["fomo", "axiom"];
/** AI Engine score floor to even consider copying — independent of, and
 * checked before, the Risk Engine's own limits. */
const MIN_AI_SCORE_TO_COPY = 55;

type SignalWalletRow = {
  id: string;
  address: string;
  source: SignalSource;
  label: string;
  win_rate: number | null;
  trades_count: number | null;
  risk_level: "low" | "medium" | "high" | null;
  drawdown_percent: number | null;
};

async function notify(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  title: string,
  description: string,
  linkUrl: string | null
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    description,
    link_url: linkUrl,
  });
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

  const summary = {
    walletsUpserted: 0,
    tradesDetected: 0,
    copyDecisions: { copie: 0, ignore: 0 },
    positionsClosed: 0,
    providerErrors: [] as string[],
  };

  // --- 1. Discover/refresh wallets for every source --------------------
  const walletsBySource = new Map<SignalSource, ReturnType<typeof getSignalProvider>>();
  for (const source of SOURCES) {
    const provider = getSignalProvider(source);
    walletsBySource.set(source, provider);

    try {
      const rawWallets = await provider.fetchWallets(source);
      for (const raw of rawWallets) {
        const score = computeWalletScore(raw);
        const { error } = await supabase.from("signal_wallets").upsert(
          {
            address: raw.address,
            chain: raw.chain,
            source: raw.source,
            label: raw.label,
            data_source_mode: provider.mode,
            win_rate: raw.winRate,
            pnl_24h: raw.pnl24h,
            pnl_7d: raw.pnl7d,
            pnl_30d: raw.pnl30d,
            trades_count: raw.tradesCount,
            polypips_score: score,
            risk_level: raw.riskLevel,
            avg_hold_time_minutes: raw.avgHoldTimeMinutes,
            drawdown_percent: raw.drawdownPercent,
            tags: raw.tags,
            positions: raw.positions,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: "address,chain" }
        );
        if (!error) summary.walletsUpserted++;
        else console.error("[sync-signal-wallets] upsert wallet failed", raw.address, error);
      }
    } catch (error) {
      if (error instanceof ProviderNotImplementedError) {
        summary.providerErrors.push(`${source}: ${error.message}`);
      } else {
        console.error(`[sync-signal-wallets] fetchWallets(${source}) unexpected error`, error);
        summary.providerErrors.push(`${source}: erreur inattendue`);
      }
    }
  }

  // --- 2. Detect new trades for every known wallet ----------------------
  const { data: allWallets } = await supabase
    .from("signal_wallets")
    .select("id, address, source, label, win_rate, trades_count, risk_level, drawdown_percent");

  const wallets = (allWallets ?? []) as SignalWalletRow[];
  const walletByAddress = new Map(wallets.map((w) => [w.address, w]));

  for (const source of SOURCES) {
    const provider = walletsBySource.get(source)!;
    const addresses = wallets.filter((w) => w.source === source).map((w) => w.address);
    if (addresses.length === 0) continue;

    let rawTrades;
    try {
      rawTrades = await provider.fetchNewTrades(source, addresses);
    } catch (error) {
      if (!(error instanceof ProviderNotImplementedError)) {
        console.error(`[sync-signal-wallets] fetchNewTrades(${source}) unexpected error`, error);
      }
      continue;
    }

    for (const raw of rawTrades) {
      const wallet = walletByAddress.get(raw.walletAddress);
      if (!wallet) continue;

      const { data: insertedTrade, error: insertError } = await supabase
        .from("signal_wallet_trades")
        .insert({
          wallet_id: wallet.id,
          token_symbol: raw.tokenSymbol,
          token_address: raw.tokenAddress,
          side: raw.side,
          amount_usd: raw.amountUsd,
          price: raw.price,
          market_cap: raw.marketCap,
          liquidity: raw.liquidity,
          volume_24h: raw.volume24h,
          pnl: raw.pnl,
          tx_hash: raw.txHash,
          traded_at: raw.tradedAt,
        })
        .select("id")
        .single();

      // A 23505 unique-violation means this exact trade (wallet_id,
      // tx_hash) was already processed in a previous sync run — skip it
      // silently rather than re-running the whole decision pipeline
      // (and re-notifying) for something already handled. This is the
      // idempotence guarantee: a retry of this function can never
      // duplicate a trade's downstream effects.
      if (insertError || !insertedTrade) {
        continue;
      }
      summary.tradesDetected++;

      // Refresh the wallet's recent_trades cache (bounded to 12, like
      // tracked_wallets.recent_movements).
      const { data: currentWallet } = await supabase
        .from("signal_wallets")
        .select("recent_trades")
        .eq("id", wallet.id)
        .single();
      const recent = [
        { tokenSymbol: raw.tokenSymbol, side: raw.side, amountUsd: raw.amountUsd, tradedAt: raw.tradedAt },
        ...(((currentWallet?.recent_trades as unknown[]) ?? [])),
      ].slice(0, 12);
      await supabase.from("signal_wallets").update({ recent_trades: recent }).eq("id", wallet.id);

      // --- Followers without Copy Trading: plain "new trade" alert -----
      const { data: followRows } = await supabase
        .from("user_signal_wallet_follows")
        .select("user_id")
        .eq("wallet_id", wallet.id);
      const followerIds = new Set((followRows ?? []).map((r) => r.user_id as string));

      const { data: enabledSettingsRows } = await supabase
        .from("signal_copy_settings")
        .select(
          "id, user_id, max_position_amount, position_percent, max_daily_amount, max_simultaneous_positions, max_slippage_percent, excluded_tokens, max_loss_amount"
        )
        .eq("wallet_id", wallet.id)
        .eq("enabled", true);
      const copyEnabledUserIds = new Set((enabledSettingsRows ?? []).map((r) => r.user_id as string));

      for (const userId of followerIds) {
        if (copyEnabledUserIds.has(userId)) continue; // gets the richer notification below instead
        const { error: dedupeError } = await supabase.from("signal_wallet_follow_notifications").insert({
          user_id: userId,
          wallet_id: wallet.id,
          tx_hash: raw.txHash,
        });
        if (dedupeError) continue; // already notified for this trade
        await notify(
          supabase,
          userId,
          "🔔 Nouveau trade détecté",
          `${wallet.label} vient de ${raw.side === "BUY" ? "acheter" : "vendre"} ${raw.tokenSymbol} (${raw.amountUsd.toLocaleString("fr-FR")} $).`,
          `/dashboard/smart-wallets/${wallet.id}`
        );
      }

      // --- Copy Trading pipeline: AI Engine → Risk Engine → decision ---
      const aiVerdict = computeSignalScore(
        {
          address: wallet.address,
          chain: "solana",
          source: wallet.source,
          label: wallet.label,
          winRate: wallet.win_rate,
          pnl24h: null,
          pnl7d: null,
          pnl30d: null,
          tradesCount: wallet.trades_count,
          riskLevel: wallet.risk_level,
          avgHoldTimeMinutes: null,
          drawdownPercent: wallet.drawdown_percent,
          tags: [],
          positions: [],
        },
        raw
      );

      for (const settingsRow of enabledSettingsRows ?? []) {
        const userId = settingsRow.user_id as string;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [{ data: copiedTodayRows }, { data: openRows }, { data: lossRows }] = await Promise.all([
          supabase
            .from("signal_copy_trades")
            .select("sized_amount")
            .eq("user_id", userId)
            .eq("decision", "copie")
            .gte("created_at", todayStart.toISOString()),
          supabase
            .from("signal_copy_trades")
            .select("id")
            .eq("user_id", userId)
            .eq("status", "en_cours"),
          supabase
            .from("signal_copy_trades")
            .select("closed_pnl")
            .eq("user_id", userId)
            .lt("closed_pnl", 0)
            .gte("closed_at", todayStart.toISOString()),
        ]);

        const amountCopiedToday = (copiedTodayRows ?? []).reduce(
          (sum, r) => sum + Number(r.sized_amount ?? 0),
          0
        );
        const openPositionsCount = (openRows ?? []).length;
        const lossesToday = (lossRows ?? []).reduce(
          (sum, r) => sum + Math.abs(Number(r.closed_pnl ?? 0)),
          0
        );

        const riskResult = applyRiskEngine({
          settings: {
            maxPositionAmount: Number(settingsRow.max_position_amount),
            positionPercent: Number(settingsRow.position_percent),
            maxDailyAmount: Number(settingsRow.max_daily_amount),
            maxSimultaneousPositions: Number(settingsRow.max_simultaneous_positions),
            maxSlippagePercent: Number(settingsRow.max_slippage_percent),
            excludedTokens: (settingsRow.excluded_tokens as string[]) ?? [],
            maxLossAmount: settingsRow.max_loss_amount === null ? null : Number(settingsRow.max_loss_amount),
          },
          trade: raw,
          amountCopiedToday,
          openPositionsCount,
          lossesToday,
        });

        const aiApproved = aiVerdict.score >= MIN_AI_SCORE_TO_COPY;
        const approved = aiApproved && riskResult.approved;
        const decision: "copie" | "ignore" = approved ? "copie" : "ignore";
        const ignoreReason = !riskResult.approved
          ? riskResult.failureReason
          : !aiApproved
            ? `Score IA insuffisant (${aiVerdict.score}/100, seuil ${MIN_AI_SCORE_TO_COPY})`
            : null;

        summary.copyDecisions[decision]++;

        const isOpeningBuy = raw.side === "BUY" && decision === "copie";
        const status = isOpeningBuy ? "en_cours" : decision === "copie" ? "ferme" : "ignore";

        const { data: copyTradeRow } = await supabase
          .from("signal_copy_trades")
          .insert({
            user_id: userId,
            wallet_id: wallet.id,
            settings_id: settingsRow.id,
            source_trade_id: insertedTrade.id,
            token_symbol: raw.tokenSymbol,
            token_address: raw.tokenAddress,
            wallet_trade_side: raw.side,
            wallet_trade_amount: raw.amountUsd,
            ai_score: aiVerdict.score,
            ai_summary:
              decision === "copie"
                ? `Score IA ${aiVerdict.score}/100 — conditions réunies, copie exécutée (mode démo).`
                : `Score IA ${aiVerdict.score}/100 — trade ignoré.`,
            ai_positives: aiVerdict.positives,
            ai_risks: aiVerdict.risks,
            risk_checks: riskResult.checks,
            decision,
            ignore_reason: ignoreReason,
            sized_amount: decision === "copie" ? riskResult.sizedAmount : null,
            entry_price: isOpeningBuy ? raw.price : null,
            status,
            execution_mode: "demo",
            opened_at: isOpeningBuy ? new Date().toISOString() : null,
            closed_at: status === "ferme" ? new Date().toISOString() : null,
          })
          .select("id")
          .single();

        // --- Position lifecycle: a SELL closes the matching open BUY ---
        // Simplification, documented: the mock provider emits atomic
        // BUY/SELL trades with no "percent of position" field, so any
        // SELL closes the whole open position rather than partially —
        // the schema (status/closed_pnl) supports partial closes once a
        // real provider supplies that data.
        if (raw.side === "SELL") {
          const { data: openPosition } = await supabase
            .from("signal_copy_trades")
            .select("id, sized_amount")
            .eq("user_id", userId)
            .eq("wallet_id", wallet.id)
            .eq("token_symbol", raw.tokenSymbol)
            .eq("status", "en_cours")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (openPosition) {
            const closedPnl = raw.pnl ?? null;
            await supabase
              .from("signal_copy_trades")
              .update({
                status: "ferme",
                closed_at: new Date().toISOString(),
                closed_pnl: closedPnl,
              })
              .eq("id", openPosition.id);
            summary.positionsClosed++;
            await notify(
              supabase,
              userId,
              "✅ Position fermée",
              `Position ${raw.tokenSymbol} sur ${wallet.label} clôturée${closedPnl !== null ? ` (${closedPnl >= 0 ? "+" : ""}${closedPnl.toLocaleString("fr-FR")} $)` : ""}.`,
              "/dashboard/smart-wallets/positions"
            );
          }
        }

        // --- Notifications for this decision ----------------------------
        const walletLink = `/dashboard/smart-wallets/${wallet.id}`;
        if (decision === "copie") {
          await notify(
            supabase,
            userId,
            "🟢 Trade copié",
            `${wallet.label} • ${raw.tokenSymbol} • Score IA ${aiVerdict.score}/100 • ${riskResult.sizedAmount.toLocaleString("fr-FR")} $ (mode démo)`,
            walletLink
          );
        } else if (!riskResult.approved) {
          await notify(supabase, userId, "⚠️ Limite de risque atteinte", ignoreReason ?? "Une limite de risque a bloqué ce trade.", walletLink);
        } else {
          await notify(
            supabase,
            userId,
            "🔴 Trade ignoré",
            `${wallet.label} • ${raw.tokenSymbol} • Score IA ${aiVerdict.score}/100 — sous le seuil requis.`,
            walletLink
          );
        }

        if (!copyTradeRow) {
          console.error("[sync-signal-wallets] échec insertion signal_copy_trades", userId, wallet.id);
        }
      }
    }
  }

  return new Response(JSON.stringify({ status: "ok", summary }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
