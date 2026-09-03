"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type ActivityPeriodKey = "7j" | "30j" | "tout";

export type ActivityPeriodCounts = {
  analyses: number;
  wallets: number;
  sport: number;
  trading: number;
  coach: number;
};

const PERIOD_OPTIONS: { key: ActivityPeriodKey; labelKey: string }[] = [
  { key: "7j", labelKey: "periods.7j" },
  { key: "30j", labelKey: "periods.30j" },
  { key: "tout", labelKey: "periods.tout" },
];

const SEGMENTS = [
  { key: "analyses" as const, labelKey: "segments.analyses", stroke: "#e52323", dot: "bg-brand-500" },
  { key: "wallets" as const, labelKey: "segments.wallets", stroke: "#34d399", dot: "bg-emerald-400" },
  { key: "sport" as const, labelKey: "segments.sport", stroke: "#38bdf8", dot: "bg-sky-400" },
  { key: "trading" as const, labelKey: "segments.trading", stroke: "#fbbf24", dot: "bg-amber-400" },
  { key: "coach" as const, labelKey: "segments.coach", stroke: "#a78bfa", dot: "bg-violet-400" },
];

const SIZE = 160;
const STROKE_WIDTH = 18;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Real 3-way split of the user's own activity (Analyses IA, wallets
 * followed, Coach IA messages) for a chosen period — every number comes
 * from `periods`, computed server-side from real timestamps. An all-zero
 * period renders an empty ring and an honest "aucune activité" note
 * instead of a fabricated distribution. */
export function ActivityDonut({
  periods,
}: {
  periods: Record<ActivityPeriodKey, ActivityPeriodCounts>;
}) {
  const t = useTranslations("Dashboard.ActivityDonut");
  const [period, setPeriod] = useState<ActivityPeriodKey>("30j");
  const counts = periods[period];
  const total = counts.analyses + counts.wallets + counts.sport + counts.trading + counts.coach;

  let cumulative = 0;
  const arcs = SEGMENTS.map((seg) => {
    const value = counts[seg.key];
    const fraction = total > 0 ? value / total : 0;
    const dash = fraction * CIRCUMFERENCE;
    const offset = cumulative;
    cumulative += dash;
    return { ...seg, value, dash, offset };
  });

  return (
    <div className="rounded-2xl border border-dash-border bg-dash-surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-dash-text">
          {t("title")}
        </h2>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setPeriod(opt.key)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors duration-150",
                period === opt.key
                  ? "border-dash-border-strong bg-dash-surface-strong text-dash-text"
                  : "border-dash-border bg-dash-surface text-dash-text-tertiary hover:text-dash-text"
              )}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-8">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="-rotate-90"
            aria-hidden
          >
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--color-dash-border)"
              strokeWidth={STROKE_WIDTH}
            />
            {total > 0 &&
              arcs
                .filter((arc) => arc.value > 0)
                .map((arc) => (
                  <circle
                    key={arc.key}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={arc.stroke}
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={`${arc.dash} ${CIRCUMFERENCE - arc.dash}`}
                    strokeDashoffset={-arc.offset}
                  />
                ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl font-bold text-dash-text">{total}</span>
            <span className="text-[11px] text-dash-text-quaternary">{t("total")}</span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2.5 sm:w-auto">
          {SEGMENTS.map((seg) => (
            <div key={seg.key} className="flex items-center justify-between gap-6 text-sm">
              <span className="flex items-center gap-2 text-dash-text-secondary">
                <span className={cn("h-2 w-2 rounded-full", seg.dot)} />
                {t(seg.labelKey)}
              </span>
              <span className="font-semibold text-dash-text">{counts[seg.key]}</span>
            </div>
          ))}
        </div>
      </div>

      {total === 0 && (
        <p className="mt-4 text-center text-xs text-dash-text-quaternary">
          {t("empty")}
        </p>
      )}
    </div>
  );
}
