import { Info, Target } from "lucide-react";
import type { Opportunity, OpportunityTone } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<OpportunityTone, string> = {
  brand: "bg-brand-500/15 text-brand-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  violet: "bg-violet-500/15 text-violet-400",
  amber: "bg-amber-500/15 text-amber-400",
  sky: "bg-sky-500/15 text-sky-400",
};

const TONE_BAR_CLASSES: Record<OpportunityTone, string> = {
  brand: "bg-brand-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  sky: "bg-sky-500",
};

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <div className="flex w-[220px] shrink-0 snap-start flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          TONE_CLASSES[opportunity.tone]
        )}
      >
        <Target className="h-4 w-4" strokeWidth={2} />
      </span>

      <div>
        <p className="text-sm font-semibold text-white">{opportunity.label}</p>
        <p className="text-[11px] text-white/40">{opportunity.marketType}</p>
      </div>

      <p className="font-display text-2xl font-bold text-white">
        {opportunity.probabilityPercent}%
        <span className="ml-1 text-xs font-medium text-white/40">de probabilité</span>
      </p>

      <div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-white/40">Confiance</span>
          <span className="font-semibold text-white">{opportunity.confidenceScore}/100</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={cn("h-full rounded-full", TONE_BAR_CLASSES[opportunity.tone])}
            style={{ width: `${opportunity.confidenceScore}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        className="mt-1 rounded-lg bg-brand-500 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
      >
        Voir l&apos;analyse
      </button>
    </div>
  );
}

export function OpportunitiesRow({ opportunities }: { opportunities: Opportunity[] }) {
  if (opportunities.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5">
        <h2 className="font-display text-base font-semibold text-white">Opportunités détectées</h2>
        <Info className="h-3.5 w-3.5 text-white/30" strokeWidth={2} />
      </div>
      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
        {opportunities.map((opp) => (
          <OpportunityCard key={opp.id} opportunity={opp} />
        ))}
      </div>
    </div>
  );
}
