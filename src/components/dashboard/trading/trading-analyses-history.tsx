"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { TradingAnalysisResult } from "@/components/dashboard/trading/trading-analysis-result";
import {
  getConfidenceLabel,
  getRecommendationLabel,
  type TradingChartAnalysis,
} from "@/lib/data/trading-analysis";
import { cn } from "@/lib/utils";

const RECOMMENDATION_TONE: Record<TradingChartAnalysis["recommendation"], string> = {
  Acheter: "bg-emerald-500/15 text-emerald-400",
  Vendre: "bg-rose-500/15 text-rose-400",
  Attendre: "bg-amber-500/15 text-amber-400",
};

function HistoryRow({
  analysis,
  onSelect,
}: {
  analysis: TradingChartAnalysis;
  onSelect: () => void;
}) {
  const t = useTranslations("Trading.History");
  const tTrading = useTranslations("Trading");
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.05]"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="truncate text-sm font-medium text-white">
          {analysis.instrument ?? t("unknownInstrument")}
        </p>
        <span className="flex items-center gap-1.5 text-xs text-white/40">
          <Clock className="h-3 w-3" />
          {analysis.analyzedAt}
          {analysis.timeframe ? ` · ${analysis.timeframe}` : ""}
        </span>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
          RECOMMENDATION_TONE[analysis.recommendation]
        )}
      >
        {getRecommendationLabel(tTrading, analysis.recommendation)} ·{" "}
        {getConfidenceLabel(tTrading, analysis.confidence)}
      </span>
    </button>
  );
}

export function TradingAnalysesHistory({ analyses }: { analyses: TradingChartAnalysis[] }) {
  const t = useTranslations("Trading.History");
  const tTrading = useTranslations("Trading");
  const [selected, setSelected] = useState<TradingChartAnalysis | null>(null);

  if (selected) {
    return (
      <TradingAnalysisResult
        analysis={selected}
        onBack={() => setSelected(null)}
        backLabel={tTrading("backToListLabel")}
      />
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
        <p className="text-sm font-medium text-white/60">{t("emptyTitle")}</p>
        <p className="max-w-sm text-xs text-white/35">{t("emptyDescription")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {analyses.map((analysis) => (
        <HistoryRow key={analysis.id} analysis={analysis} onSelect={() => setSelected(analysis)} />
      ))}
    </div>
  );
}
