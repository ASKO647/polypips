"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { SportsEmptyState } from "@/components/dashboard/sports/sports-empty-state";
import type { Match, TeamComparisonStat } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

function StatRow({
  stat,
  homeLabel,
  awayLabel,
}: {
  stat: TeamComparisonStat;
  homeLabel: string;
  awayLabel: string;
}) {
  const hasValues = stat.homeValue !== null && stat.awayValue !== null;
  const max = hasValues ? Math.max(stat.homeValue!, stat.awayValue!, 1) : 1;
  const homeWidth = hasValues ? (stat.homeValue! / max) * 100 : 0;
  const awayWidth = hasValues ? (stat.awayValue! / max) * 100 : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-white">
          {stat.homeValue ?? "—"}
          {stat.homeVsLeagueAvgPercent !== null && (
            <span className={stat.homeVsLeagueAvgPercent >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {stat.homeVsLeagueAvgPercent >= 0 ? "+" : ""}
              {stat.homeVsLeagueAvgPercent}%
            </span>
          )}
        </span>
        <span className="text-white/40">{stat.label}{stat.unit ? ` (${stat.unit})` : ""}</span>
        <span className="flex items-center gap-1.5 font-semibold text-white">
          {stat.awayVsLeagueAvgPercent !== null && (
            <span className={stat.awayVsLeagueAvgPercent >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {stat.awayVsLeagueAvgPercent >= 0 ? "+" : ""}
              {stat.awayVsLeagueAvgPercent}%
            </span>
          )}
          {stat.awayValue ?? "—"}
        </span>
      </div>
      <div className="flex h-1.5 gap-0.5">
        <div className="flex flex-1 justify-end overflow-hidden rounded-l-full bg-white/5">
          <div className="h-full rounded-l-full bg-brand-500" style={{ width: `${homeWidth}%` }} />
        </div>
        <div className="flex flex-1 overflow-hidden rounded-r-full bg-white/5">
          <div className="h-full rounded-r-full bg-sky-400" style={{ width: `${awayWidth}%` }} />
        </div>
      </div>
      <span className="sr-only">{homeLabel}</span>
      <span className="sr-only">{awayLabel}</span>
    </div>
  );
}

export function StatsTab({ match, comparison }: { match: Match; comparison: TeamComparisonStat[] }) {
  const [mode, setMode] = useState<"comparaison" | "moyennes">("comparaison");
  const [window, setWindow] = useState<"5" | "saison">("5");

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-sm font-semibold text-white">Comparaison des équipes</h3>
        <div className="flex flex-wrap gap-2">
          <div className="flex overflow-hidden rounded-full border border-white/10">
            {(["comparaison", "moyennes"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-semibold capitalize transition-colors duration-150",
                  mode === m ? "bg-brand-500/15 text-brand-400" : "text-white/50 hover:text-white"
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex overflow-hidden rounded-full border border-white/10">
            {(["5", "saison"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWindow(w)}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-semibold transition-colors duration-150",
                  window === w ? "bg-brand-500/15 text-brand-400" : "text-white/50 hover:text-white"
                )}
              >
                {w === "5" ? "5 derniers matchs" : "Saison"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-white/60">
        <span>{match.homeTeam.shortName}</span>
        <span>{match.awayTeam.shortName}</span>
      </div>

      {comparison.length === 0 ? (
        <SportsEmptyState
          icon={BarChart3}
          title="Statistiques pas encore disponibles"
          message="Buts marqués/encaissés, tirs, possession, corners — dès qu'une source de statistiques réelle sera connectée, la comparaison s'affichera ici avec l'écart par rapport à la moyenne de la ligue."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {comparison.map((stat) => (
            <StatRow
              key={stat.label}
              stat={stat}
              homeLabel={match.homeTeam.shortName}
              awayLabel={match.awayTeam.shortName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
