import type { RawSignalTrade } from "../_shared/signal-providers/index.ts";

/**
 * The Risk Engine — deliberately independent from the AI Engine
 * (ai-engine.ts). It never looks at the AI score; it only checks the
 * user's own configured limits against the trade being considered, and
 * ALWAYS runs, even when the AI Engine already scored the trade highly.
 * Per the brief: "Même si AI SCORE = 95/100, le Risk Engine peut dire
 * IGNORE si liquidité insuffisante / montant trop important / etc."
 *
 * Copy Trading here means exactly what it means for Polymarket
 * (sync-smart-money's evaluateMovement): watch + AI/risk-filtered
 * notification with a real external link, never an executed or tracked
 * position. These checks decide whether a trade generates a "copié" vs.
 * "ignoré" notification — nothing here ever sizes or places an order.
 *
 * Every check is logged (not just the first failure) so a user can see
 * exactly why a trade was ignored, not just that it was.
 */

export type RiskCheck = { rule: string; passed: boolean; detail: string };

export type RiskEngineInput = {
  settings: {
    maxPositionAmount: number;
    positionPercent: number;
    maxDailyAmount: number;
    maxSimultaneousPositions: number;
    maxSlippagePercent: number;
    excludedTokens: string[];
  };
  trade: RawSignalTrade;
  /** Sum of sized_amount for this user's 'copie' decisions already made
   * today (before this trade). */
  amountCopiedToday: number;
  /** Count of this user's 'copie' decisions in the lookback window (see
   * POSITION_LOOKBACK_DAYS in index.ts) — a proxy for "simultaneous
   * positions" exactly like sync-smart-money's own suggestion-count cap,
   * since there's no real (or simulated) open position to count instead. */
  recentCopyCount: number;
};

export type RiskEngineResult = {
  approved: boolean;
  sizedAmount: number;
  checks: RiskCheck[];
  /** First failing check's detail, or null if approved — this is what
   * gets stored as signal_copy_trades.ignore_reason. */
  failureReason: string | null;
};

function estimateSlippagePercent(trade: RawSignalTrade): number | null {
  if (trade.liquidity === null || trade.liquidity <= 0) return null;
  return Math.min(50, (trade.amountUsd / trade.liquidity) * 100);
}

export function applyRiskEngine(input: RiskEngineInput): RiskEngineResult {
  const { settings, trade } = input;
  const checks: RiskCheck[] = [];

  const tokenExcluded = settings.excludedTokens
    .map((t) => t.trim().toUpperCase())
    .includes(trade.tokenSymbol.trim().toUpperCase());
  checks.push({
    rule: "token_exclu",
    passed: !tokenExcluded,
    detail: tokenExcluded
      ? `${trade.tokenSymbol} fait partie de vos tokens exclus`
      : "Token non exclu",
  });

  const liquidityOk = trade.liquidity === null || trade.liquidity >= 5_000;
  checks.push({
    rule: "liquidite_suffisante",
    passed: liquidityOk,
    detail: liquidityOk
      ? "Liquidité suffisante"
      : `Liquidité insuffisante (${trade.liquidity?.toLocaleString("fr-FR")} $)`,
  });

  const slippage = estimateSlippagePercent(trade);
  const slippageOk = slippage === null || slippage <= settings.maxSlippagePercent;
  checks.push({
    rule: "slippage_maximum",
    passed: slippageOk,
    detail:
      slippage === null
        ? "Slippage non estimable"
        : slippageOk
          ? `Slippage estimé ${slippage.toFixed(1)}% (≤ ${settings.maxSlippagePercent}%)`
          : `Slippage estimé trop élevé (${slippage.toFixed(1)}% > ${settings.maxSlippagePercent}%)`,
  });

  const sizedAmount = Math.min(
    (trade.amountUsd * settings.positionPercent) / 100,
    settings.maxPositionAmount
  );
  checks.push({
    rule: "montant_max_par_trade",
    passed: true,
    detail: `Montant plafonné à ${sizedAmount.toLocaleString("fr-FR")} $ (position wallet ${trade.amountUsd.toLocaleString("fr-FR")} $ × ${settings.positionPercent}%, plafond ${settings.maxPositionAmount.toLocaleString("fr-FR")} $)`,
  });

  const dailyOk = input.amountCopiedToday + sizedAmount <= settings.maxDailyAmount;
  checks.push({
    rule: "limite_quotidienne",
    passed: dailyOk,
    detail: dailyOk
      ? "Limite quotidienne respectée"
      : `Limite quotidienne atteinte (${input.amountCopiedToday.toLocaleString("fr-FR")} $ déjà copiés aujourd'hui, plafond ${settings.maxDailyAmount.toLocaleString("fr-FR")} $)`,
  });

  const positionsOk = input.recentCopyCount < settings.maxSimultaneousPositions;
  checks.push({
    rule: "positions_simultanees",
    passed: positionsOk,
    detail: positionsOk
      ? "Sous le nombre maximum de positions simultanées"
      : `Nombre maximum de positions simultanées atteint (${input.recentCopyCount}/${settings.maxSimultaneousPositions})`,
  });

  const firstFailure = checks.find((c) => !c.passed) ?? null;

  return {
    approved: firstFailure === null,
    sizedAmount,
    checks,
    failureReason: firstFailure?.detail ?? null,
  };
}
