"use client";

import { useState } from "react";
import { WalletChart } from "@/components/ui/wallet-chart";
import type { EvolutionPeriod } from "@/lib/data/stats";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS: { key: EvolutionPeriod; label: string }[] = [
  { key: "7j", label: "7 jours" },
  { key: "30j", label: "30 jours" },
  { key: "tout", label: "Tout" },
];

/**
 * Real cumulative win-rate curve, one point per resolved analysis in
 * chronological order (see computeAccuracyEvolutionPeriods) — resolutions
 * land at irregular real-world moments, not on a fixed daily grid, so a
 * period with fewer than 2 resolved analyses has nothing to draw a line
 * through and shows an honest note instead of a flat or fabricated one.
 */
export function AccuracyEvolutionChart({
  periods,
}: {
  periods: Record<EvolutionPeriod, number[]>;
}) {
  const [period, setPeriod] = useState<EvolutionPeriod>("30j");
  const points = periods[period];
  const latest = points.length > 0 ? points[points.length - 1] : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
            Évolution de la précision
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-white">
            {latest !== null ? `${Math.round(latest)}%` : "—"}
          </p>
        </div>
        <div className="flex gap-1.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setPeriod(opt.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
                period === opt.key
                  ? "border-white/25 bg-white/[0.1] text-white"
                  : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 h-32 sm:h-40">
        {points.length >= 2 ? (
          <WalletChart points={points} positive />
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 px-4 text-center">
            <p className="text-xs text-white/35">
              Pas encore assez d&apos;analyses résolues sur cette période.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
