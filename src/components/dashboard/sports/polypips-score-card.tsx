import { Gauge } from "lucide-react";
import type { PolypipsScoreBreakdown } from "@/lib/sports/types";
import { PROBABILISTIC_DISCLAIMER } from "@/lib/sports/types";
import { SportsEmptyState } from "@/components/dashboard/sports/sports-empty-state";

const BREAKDOWN_LABELS: { key: keyof Omit<PolypipsScoreBreakdown, "overall">; label: string }[] = [
  { key: "form", label: "Forme" },
  { key: "stats", label: "Statistiques" },
  { key: "h2h", label: "H2H" },
  { key: "lineups", label: "Compositions" },
  { key: "market", label: "Marché" },
];

function confidenceLabel(score: number): string {
  if (score >= 75) return "Forte confiance";
  if (score >= 50) return "Confiance moyenne";
  return "Confiance faible";
}

/** Circular gauge for the composite "Polypips Score" (0-100). Renders an
 * honest empty ring with "—" when overall is null — never a plausible
 * placeholder number. */
function ScoreGauge({ score }: { score: number | null }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const progress = score === null ? 0 : (score / 100) * circumference;

  return (
    <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        {score !== null && (
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#34d399"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
          />
        )}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-3xl font-bold text-white">{score ?? "—"}</span>
        {score !== null && <span className="text-[10px] text-white/40">/100</span>}
      </div>
    </div>
  );
}

export function PolypipsScoreCard({ breakdown }: { breakdown: PolypipsScoreBreakdown | null }) {
  if (!breakdown || breakdown.overall === null) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="font-display text-sm font-semibold text-white">Polypips Score</h3>
        <SportsEmptyState
          icon={Gauge}
          title="Score pas encore disponible"
          message="Le Polypips Score combine forme, statistiques, historique, compositions et marché en un seul indicateur — il s'affichera dès qu'une vraie source de données sera connectée."
          compact
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center">
      <div className="flex flex-col items-center gap-2">
        <ScoreGauge score={breakdown.overall} />
        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
          {confidenceLabel(breakdown.overall)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5">
        {BREAKDOWN_LABELS.map(({ key, label }) => {
          const value = breakdown[key];
          return (
            <div key={key}>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-white/50">{label}</span>
                <span className="font-semibold text-white/70">{value === null ? "—" : `${value}/100`}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${value ?? 0}%` }}
                />
              </div>
            </div>
          );
        })}
        <p className="mt-1 text-[11px] leading-relaxed text-white/30">{PROBABILISTIC_DISCLAIMER}</p>
      </div>
    </div>
  );
}
