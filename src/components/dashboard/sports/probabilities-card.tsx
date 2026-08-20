import { Info } from "lucide-react";
import type { Match, MatchProbabilities } from "@/lib/sports/types";
import { PROBABILISTIC_DISCLAIMER } from "@/lib/sports/types";

function ProbabilityColumn({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{label}</p>
      <p className="font-display text-2xl font-bold text-white">{value}%</p>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function ProbabilitiesCard({
  match,
  probabilities,
  confidenceScore,
}: {
  match: Match;
  probabilities: MatchProbabilities;
  confidenceScore: number;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-1.5">
        <h2 className="font-display text-base font-semibold text-white">Probabilités Polypips</h2>
        <Info className="h-3.5 w-3.5 text-white/30" strokeWidth={2} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <ProbabilityColumn
          label={match.homeTeam.shortName}
          value={probabilities.home}
          color={match.homeTeam.accentColor ?? "var(--color-brand-500)"}
        />
        <ProbabilityColumn label="Nul" value={probabilities.draw} color="#94a3b8" />
        <ProbabilityColumn
          label={match.awayTeam.shortName}
          value={probabilities.away}
          color={match.awayTeam.accentColor ?? "var(--color-brand-500)"}
        />
      </div>

      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-white/50">Confiance de l&apos;analyse</span>
          <span className="font-bold text-white">{confidenceScore}/100</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${confidenceScore}%` }}
          />
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-white/35">{PROBABILISTIC_DISCLAIMER}</p>
    </div>
  );
}
