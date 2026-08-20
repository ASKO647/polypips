import type { MatchVerdict } from "@/lib/sports/types";
import { PROBABILISTIC_DISCLAIMER } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

const CONFIDENCE_LABEL = (score: number): string => {
  if (score >= 75) return "Confiance élevée";
  if (score >= 50) return "Confiance moyenne";
  return "Confiance faible";
};

export function VerdictCard({ verdict }: { verdict: MatchVerdict }) {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-white">Verdict Polypips</h2>
        <span className="rounded-md bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-400">
          IA
        </span>
      </div>

      <p className="text-sm leading-relaxed text-white/60">{verdict.explanation}</p>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
        <p className="font-display text-lg font-bold text-brand-400">{verdict.outcome}</p>
        <span
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold",
            verdict.confidenceScore >= 75
              ? "bg-emerald-500/15 text-emerald-400"
              : verdict.confidenceScore >= 50
                ? "bg-amber-500/15 text-amber-400"
                : "bg-white/[0.08] text-white/50"
          )}
        >
          {CONFIDENCE_LABEL(verdict.confidenceScore)}
        </span>
      </div>

      <p className="text-[11px] leading-relaxed text-white/35">{PROBABILISTIC_DISCLAIMER}</p>
    </div>
  );
}
