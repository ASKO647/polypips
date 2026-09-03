"use client";

import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/providers/currency-provider";
import type { PerformanceStats } from "@/lib/supabase/performance";
import { cn } from "@/lib/utils";

/**
 * `stats === null` (or resolvedCount === 0) means no analysis has been
 * resolved yet for this user — resolve-markets hasn't confirmed any real
 * market outcome, so this mirrors StatsEmptyState's own honest empty
 * state rather than inventing numbers. Once real resolutions exist, every
 * number shown is real, but win rate/ROI/P&L are still a *simulation* of
 * what following each AI decision with a fixed theoretical stake would
 * have generated — never a claim about the user's actual money — labeled
 * as such directly on the card, not just in a tooltip.
 */
export function PerformanceCard({ stats }: { stats: PerformanceStats | null }) {
  const { formatAmount } = useCurrency();
  const t = useTranslations("Dashboard.PerformanceCard");

  if (!stats || stats.resolvedCount === 0) {
    return (
      <div className="rounded-2xl border border-dash-border bg-dash-surface p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-dash-text">
          {t("title")}
        </h2>

        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-dash-border px-6 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-dash-surface-strong">
            <TrendingUp className="h-5 w-5 text-dash-text-quaternary" />
          </span>
          <p className="text-sm font-semibold text-dash-text">
            {t("emptyTitle")}
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-dash-text-quaternary">
            {t("emptyDescription")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dash-border bg-dash-surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-dash-text">
          {t("title")}
        </h2>
        <span className="shrink-0 text-[11px] font-semibold text-dash-text-quaternary">
          {t("resolvedCount", { count: stats.resolvedCount })}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-dash-text-quaternary">
        {t("simulationNote")}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="font-display text-lg font-bold text-dash-text">
            {Math.round(stats.winRate)}%
          </p>
          <p className="mt-0.5 text-[11px] text-dash-text-quaternary">{t("winRate")}</p>
        </div>
        <div>
          <p
            className={cn(
              "font-display text-lg font-bold",
              stats.simulatedRoi >= 0 ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {stats.simulatedRoi >= 0 ? "+" : ""}
            {stats.simulatedRoi.toFixed(1)}%
          </p>
          <p className="mt-0.5 text-[11px] text-dash-text-quaternary">{t("roiSimule")}</p>
        </div>
        <div>
          <p
            className={cn(
              "font-display text-lg font-bold",
              stats.simulatedPnl >= 0 ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {formatAmount(stats.simulatedPnl, { signed: true })}
          </p>
          <p className="mt-0.5 text-[11px] text-dash-text-quaternary">{t("pnlSimule")}</p>
        </div>
      </div>
    </div>
  );
}
