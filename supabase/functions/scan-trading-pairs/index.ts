import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { fetchKlines, BinanceUnavailableError, type BinanceInterval } from "../_shared/binance.ts";
import {
  analyzeTradingCandles,
  type TradingChartVerdict,
} from "../analyze-trading-chart/anthropic-trading-analysis.ts";
import { AiServiceError } from "../analyze-market/anthropic-analysis.ts";

/**
 * The Trading universe's "Sélection du jour" — same automated-scan concept
 * as scan-markets/scan-sport-matches, applied to a fixed watchlist of
 * major crypto pairs: fetch real OHLC candles from Binance's free public
 * API (no key required), run the same analyzeTradingCandles verdict
 * pipeline used by the on-demand screenshot flow on each pair, and
 * persist the result so every user sees fresh, already-analyzed pairs
 * without spending their own daily quota.
 *
 * Unlike scan-markets/scan-sport-matches, there's no "candidate pool to
 * filter down" here — PAIRS below already IS the selection, a fixed
 * watchlist rather than something discovered/qualified each run. Every
 * pair gets exactly one Anthropic call per run, no more.
 *
 * Crypto only, deliberately, not forex: crypto price/candle data is free
 * and keyless (Binance's public API); forex data generally sits behind a
 * paid subscription this project doesn't have. See PAIRS' own comment for
 * why these six specifically.
 */

/** Five large-cap pairs plus one meme coin (DOGE) for the "content worth
 * sharing" angle this feature is explicitly for — not a trading-signal
 * feed. `symbol` is Binance's own ticker (no separator); `displaySymbol`
 * is what the AI prompt and the UI show. */
const PAIRS: { symbol: string; displaySymbol: string }[] = [
  { symbol: "BTCUSDT", displaySymbol: "BTC/USDT" },
  { symbol: "ETHUSDT", displaySymbol: "ETH/USDT" },
  { symbol: "SOLUSDT", displaySymbol: "SOL/USDT" },
  { symbol: "BNBUSDT", displaySymbol: "BNB/USDT" },
  { symbol: "XRPUSDT", displaySymbol: "XRP/USDT" },
  { symbol: "DOGEUSDT", displaySymbol: "DOGE/USDT" },
];

/** 4h candles, 60 of them (~10 days of price action) — enough context for
 * a trend/support-resistance read without an oversized prompt. */
const INTERVAL: BinanceInterval = "4h";
const CANDLE_COUNT = 60;
const TIMEFRAME_LABEL = "4h";

function confidenceLabel(value: string): "Faible" | "Moyenne" | "Élevée" {
  if (value === "Faible" || value === "Moyenne" || value === "Élevée") return value;
  return "Moyenne";
}

type SelectedTradingRow = {
  symbol: string;
  display_symbol: string;
  instrument: string | null;
  timeframe: string | null;
  recommendation: TradingChartVerdict["recommendation"];
  confidence: "Faible" | "Moyenne" | "Élevée";
  trend_analysis: string;
  key_levels: TradingChartVerdict["keyLevels"];
  indicators_observed: string[];
  take_profit: string | null;
  stop_loss: string | null;
  explanation: string;
  risks: string[];
  scanned_at: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Cron-only, same posture as scan-markets/scan-sport-matches.
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
  const scannedAt = new Date().toISOString();

  const rows: SelectedTradingRow[] = [];
  let failed = 0;

  for (const pair of PAIRS) {
    let candles;
    try {
      candles = await fetchKlines(pair.symbol, INTERVAL, CANDLE_COUNT);
    } catch (error) {
      failed++;
      console.error(
        `[scan-trading-pairs] Binance fetch failed for ${pair.symbol}`,
        error instanceof BinanceUnavailableError ? error.message : error
      );
      continue;
    }

    if (candles.length === 0) {
      failed++;
      console.error(`[scan-trading-pairs] no candles returned for ${pair.symbol}`);
      continue;
    }

    try {
      const verdict = await analyzeTradingCandles({
        displaySymbol: pair.displaySymbol,
        timeframe: TIMEFRAME_LABEL,
        candles,
      });
      rows.push({
        symbol: pair.symbol,
        display_symbol: pair.displaySymbol,
        instrument: verdict.instrument ?? pair.displaySymbol,
        timeframe: verdict.timeframe ?? TIMEFRAME_LABEL,
        recommendation: verdict.recommendation,
        confidence: confidenceLabel(verdict.confidence),
        trend_analysis: verdict.trendAnalysis,
        key_levels: verdict.keyLevels,
        indicators_observed: verdict.indicatorsObserved,
        take_profit: verdict.takeProfit,
        stop_loss: verdict.stopLoss,
        explanation: verdict.explanation,
        risks: verdict.risks,
        scanned_at: scannedAt,
      });
    } catch (error) {
      failed++;
      console.error(
        `[scan-trading-pairs] analysis failed for ${pair.symbol}`,
        error instanceof AiServiceError ? error.message : error
      );
    }
  }

  // Full replace, same reasoning as scan-markets/scan-sport-matches: this
  // run's picks become the entire table rather than a cumulative history.
  const { error: deleteError } = await supabase
    .from("selected_trading_analyses")
    .delete()
    .not("id", "is", null);
  if (deleteError) {
    console.error("[scan-trading-pairs] failed to clear previous selection", deleteError);
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("selected_trading_analyses").insert(rows);
    if (insertError) {
      console.error("[scan-trading-pairs] failed to insert new selection", insertError);
    }
  }

  const summary = { attempted: PAIRS.length, selected: rows.length, failed };
  console.log("[scan-trading-pairs] run complete", summary);

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
