import type { RawSignalTrade, RawSignalWallet } from "../_shared/signal-providers/index.ts";

/**
 * The AI Engine — deliberately independent from the Risk Engine (see
 * risk-engine.ts). This module only ever answers "how good does this
 * wallet/trade look", never "are we allowed to copy it": those are the
 * Risk Engine's limits, applied afterward and unconditionally, exactly per
 * the brief's "même si AI SCORE = 95/100, le Risk Engine peut dire IGNORE"
 * requirement.
 *
 * This runs synchronously inside sync-signal-wallets for every fresh trade
 * on every sync tick, so it's a documented heuristic scorer rather than a
 * live call to the Anthropic API per trade — the same design already used
 * by sync-smart-money's computeWalletQuality() for Polymarket wallets, for
 * the same reason (an unbounded number of LLM calls per background sync
 * run is neither fast nor cost-controlled). The interactive, user-facing
 * "Analyse IA" for a single Fomo/Axiom bet/screenshot DOES call Claude —
 * see analyze-signal-bet's anthropic-signal-analysis.ts.
 */

export type AiEngineVerdict = {
  score: number;
  positives: string[];
  risks: string[];
};

/** Wallet-level score (no specific trade to weigh) — what the Smart
 * Wallets list/detail pages show as "Score PolyPips" for a wallet. Uses
 * the same fundamentals-only inputs as computeSignalScore() minus the
 * trade-specific liquidity/market-cap/volume terms. */
export function computeWalletScore(wallet: RawSignalWallet): number {
  let score = 0;
  const winRate = wallet.winRate ?? null;
  if (winRate !== null) score += Math.round((winRate / 100) * 45);

  const trades = wallet.tradesCount ?? 0;
  if (trades >= 50) score += 20;
  else if (trades >= 10) score += 10;

  if (wallet.riskLevel === "low") score += 20;
  else if (wallet.riskLevel === "medium") score += 8;
  else if (wallet.riskLevel === "high") score -= 10;

  if (wallet.drawdownPercent !== null && wallet.drawdownPercent !== undefined) {
    if (wallet.drawdownPercent > 40) score -= 15;
    else if (wallet.drawdownPercent < 15) score += 15;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function computeSignalScore(wallet: RawSignalWallet, trade: RawSignalTrade): AiEngineVerdict {
  const positives: string[] = [];
  const risks: string[] = [];
  let score = 0;

  const winRate = wallet.winRate ?? null;
  if (winRate !== null) {
    score += Math.round((winRate / 100) * 35);
    if (winRate >= 65) positives.push(`Win rate élevé (${winRate}%)`);
    else if (winRate < 45) risks.push(`Win rate faible (${winRate}%)`);
  }

  const trades = wallet.tradesCount ?? 0;
  if (trades >= 50) {
    score += 12;
    positives.push(`Historique conséquent (${trades} trades)`);
  } else if (trades >= 10) {
    score += 6;
  } else {
    risks.push("Historique de trading limité");
  }

  if (wallet.riskLevel === "low") {
    score += 15;
    positives.push("Profil de risque du wallet : faible");
  } else if (wallet.riskLevel === "high") {
    score -= 10;
    risks.push("Profil de risque du wallet : élevé");
  }

  if (wallet.drawdownPercent !== null && wallet.drawdownPercent !== undefined) {
    if (wallet.drawdownPercent > 40) {
      score -= 10;
      risks.push(`Drawdown historique important (${wallet.drawdownPercent}%)`);
    } else if (wallet.drawdownPercent < 15) {
      score += 8;
    }
  }

  if (trade.liquidity !== null) {
    if (trade.liquidity >= 50_000) {
      score += 15;
      positives.push("Liquidité du token confortable");
    } else if (trade.liquidity < 10_000) {
      score -= 20;
      risks.push("Liquidité du token très faible");
    } else {
      score += 5;
    }
  } else {
    risks.push("Liquidité du token indisponible");
  }

  if (trade.marketCap !== null) {
    if (trade.marketCap >= 500_000) {
      score += 8;
    } else if (trade.marketCap < 50_000) {
      score -= 10;
      risks.push("Market cap très faible (token à un stade précoce/risqué)");
    }
  }

  if (trade.volume24h !== null && trade.liquidity !== null && trade.liquidity > 0) {
    const ratio = trade.volume24h / trade.liquidity;
    if (ratio > 8) {
      score -= 10;
      risks.push("Volume anormalement élevé par rapport à la liquidité (activité suspecte)");
    }
  }

  if (positives.length === 0) positives.push("Aucun signal positif net identifié");
  if (risks.length === 0) risks.push("Aucun risque majeur identifié sur les données disponibles");

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    positives,
    risks,
  };
}
