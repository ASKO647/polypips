"use client";

import { useTranslations } from "next-intl";
import {
  ArrowDown,
  ArrowUp,
  Minus,
  ShieldAlert,
  Target,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfidenceMeter } from "@/components/dashboard/analyse-ia/confidence-meter";
import {
  getConfidenceLabel,
  getKeyLevelTypeLabel,
  getRecommendationLabel,
  getTradingDisclaimer,
  type TradingChartAnalysis,
} from "@/lib/data/trading-analysis";
import { cn } from "@/lib/utils";

const RECOMMENDATION_STYLE: Record<
  TradingChartAnalysis["recommendation"],
  { icon: typeof ArrowUp; tone: string; bg: string }
> = {
  Acheter: { icon: ArrowUp, tone: "text-emerald-400", bg: "bg-emerald-500/15" },
  Vendre: { icon: ArrowDown, tone: "text-rose-400", bg: "bg-rose-500/15" },
  Attendre: { icon: Minus, tone: "text-amber-400", bg: "bg-amber-500/15" },
};

export function TradingAnalysisResult({
  analysis,
  onBack,
  backLabel,
}: {
  analysis: TradingChartAnalysis;
  onBack: () => void;
  backLabel?: string;
}) {
  const t = useTranslations("Trading.Result");
  const tTrading = useTranslations("Trading");
  const { icon: RecoIcon, tone, bg } = RECOMMENDATION_STYLE[analysis.recommendation];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {analysis.instrument && (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/60">
              {analysis.instrument}
            </span>
          )}
          {analysis.timeframe && <span className="text-xs text-white/35">{analysis.timeframe}</span>}
        </div>
        <h1 className="font-display text-xl font-bold leading-snug text-white sm:text-2xl">
          {t("heading")}
        </h1>
      </div>

      {/* Mandatory, always-visible risk disclaimer — never omitted regardless of
       * recommendation or confidence, per the app-wide "never a guarantee"
       * rule, applied even more strictly here given leveraged trading risk. */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3.5">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" strokeWidth={2} />
        <p className="text-xs leading-relaxed text-amber-200/90">{getTradingDisclaimer(tTrading)}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl",
                bg,
                tone
              )}
            >
              <RecoIcon className="h-7 w-7" strokeWidth={2.25} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                {t("recommendationLabel")}
              </p>
              <p className={cn("font-display text-2xl font-bold", tone)}>
                {getRecommendationLabel(tTrading, analysis.recommendation)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              {t("confidenceLabel")}
            </p>
            <p className="mt-1 text-xl font-bold text-white">
              {getConfidenceLabel(tTrading, analysis.confidence)}
            </p>
            <ConfidenceMeter level={analysis.confidence} className="mt-2.5 w-32" />
          </div>
        </div>

        {(analysis.takeProfit || analysis.stopLoss) && (
          <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                <Target className="h-3.5 w-3.5" strokeWidth={2.25} />
                {t("takeProfit")}
              </p>
              <p className="mt-1 text-lg font-bold text-white">{analysis.takeProfit ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rose-400">
                <Target className="h-3.5 w-3.5" strokeWidth={2.25} />
                {t("stopLoss")}
              </p>
              <p className="mt-1 text-lg font-bold text-white">{analysis.stopLoss ?? "—"}</p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40">
          <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.25} />
          {t("trendAnalysis")}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-[15px]">
          {analysis.trendAnalysis}
        </p>
      </div>

      {analysis.keyLevels.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
            {t("keyLevels")}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {analysis.keyLevels.map((kl, i) => (
              <div
                key={`${kl.type}-${kl.level}-${i}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-2.5"
              >
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide",
                    kl.type === "support" ? "text-emerald-400" : "text-rose-400"
                  )}
                >
                  {getKeyLevelTypeLabel(tTrading, kl.type)}
                </span>
                <span className="text-sm font-bold text-white">{kl.level}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.indicatorsObserved.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
            {t("indicatorsObserved")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.indicatorsObserved.map((indicator) => (
              <span
                key={indicator}
                className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs text-white/70"
              >
                {indicator}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
          {t("explanation")}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-[15px]">
          {analysis.explanation}
        </p>
      </div>

      {analysis.risks.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
            <TriangleAlert className="h-3.5 w-3.5" strokeWidth={2.25} />
            {t("risks")}
          </p>
          <ul className="mt-3 flex flex-col gap-2.5">
            {analysis.risks.map((risk) => (
              <li key={risk} className="flex items-start gap-2 text-sm leading-relaxed text-white/70">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" strokeWidth={2} />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button type="button" variant="outline" onClick={onBack} className="sm:flex-1">
          {backLabel ?? tTrading("backLabel")}
        </Button>
      </div>
    </div>
  );
}
