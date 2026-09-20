"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CandlestickChart } from "lucide-react";
import { TradingAnalysisResult } from "@/components/dashboard/trading/trading-analysis-result";
import { TradingPairCard } from "@/components/dashboard/trading/trading-pair-card";
import { SyncCountdown } from "@/components/dashboard/sync-countdown";
import { OnDemandScanButton } from "@/components/dashboard/on-demand-scan-button";
import type { TradingChartAnalysis } from "@/lib/data/trading-analysis";
import { SYNC_TRADING_SELECTION_INTERVAL_MINUTES } from "@/lib/data/trading-analysis";
import type { PlanId } from "@/lib/stripe/plans";

export function TradingSelectionFlow({
  analyses,
  hasActiveSubscription,
  currentPlan,
  lastSyncedAt,
}: {
  analyses: TradingChartAnalysis[];
  hasActiveSubscription: boolean;
  currentPlan: PlanId | null;
  lastSyncedAt: string | null;
}) {
  const t = useTranslations("Trading.Selection");
  const [selected, setSelected] = useState<TradingChartAnalysis | null>(null);

  if (selected) {
    return (
      <TradingAnalysisResult
        analysis={selected}
        onBack={() => setSelected(null)}
        backLabel={t("backToListLabel")}
        locked={!hasActiveSubscription}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {t("heading")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <SyncCountdown
            lastSyncedAt={lastSyncedAt}
            intervalMinutes={SYNC_TRADING_SELECTION_INTERVAL_MINUTES}
            label={t("countdownLabel")}
          />
          <OnDemandScanButton feature="trading" currentPlan={currentPlan} />
        </div>
      </div>

      {analyses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
            <CandlestickChart className="h-5 w-5" strokeWidth={2} />
          </span>
          <p className="text-sm font-semibold text-white">{t("emptyTitle")}</p>
          <p className="max-w-sm text-xs leading-relaxed text-white/45">{t("emptyDescription")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {analyses.map((analysis) => (
            <TradingPairCard
              key={analysis.id}
              analysis={analysis}
              onViewDetail={() => setSelected(analysis)}
              locked={!hasActiveSubscription}
            />
          ))}
        </div>
      )}
    </div>
  );
}
