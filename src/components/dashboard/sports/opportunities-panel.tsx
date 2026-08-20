import { Flame } from "lucide-react";
import { SportsEmptyState } from "@/components/dashboard/sports/sports-empty-state";
import type { Opportunity } from "@/lib/sports/types";

export function OpportunitiesPanel({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
        <Flame className="h-4 w-4 text-brand-400" strokeWidth={2} />
        Opportunités détectées
      </h3>

      {opportunities.length === 0 ? (
        <SportsEmptyState
          icon={Flame}
          title="Aucune pour ce match"
          message="Aucun moteur de détection n'est encore connecté."
          compact
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {opportunities.map((opp) => (
            <div key={opp.id} className="flex items-center justify-between gap-2 text-xs">
              <div>
                <p className="font-semibold text-white">{opp.label}</p>
                <p className="text-white/40">Confiance {opp.confidenceScore}/100</p>
              </div>
              <span className="font-bold text-brand-400">{opp.probabilityPercent}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
