import { ListChecks } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SportsEmptyState } from "@/components/dashboard/sports/sports-empty-state";
import type { AnalysisFactor } from "@/lib/sports/types";
import { PROBABILISTIC_DISCLAIMER } from "@/lib/sports/types";

/** "Analyse Polypips" — the numbered-factor explanation card (01 Forme
 * offensive / 02 Défense adverse / 03 Confrontations / 04 Modèle
 * prédictif in the reference mockup). Every factor here is real model
 * output tied to a specific match, never templated boilerplate — so with
 * no model connected yet, this is an honest empty state rather than a
 * generic paragraph pretending to be an explanation. */
export function AnalysePolypipsCard({ factors }: { factors: AnalysisFactor[] }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
          <ListChecks className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <h3 className="font-display text-sm font-semibold text-white">Analyse Polypips</h3>
      </div>

      {factors.length === 0 ? (
        <SportsEmptyState
          icon={ListChecks}
          title="Analyse pas encore disponible"
          message="L'analyse détaillée (forme offensive, défense adverse, confrontations, modèle prédictif) s'affichera ici dès qu'une source de données et un modèle réel seront connectés à ce match."
          compact
        />
      ) : (
        <div className="flex flex-col gap-4">
          {factors.map((factor) => (
            <div key={factor.order} className="flex gap-3">
              <span className="font-display text-lg font-bold text-white/20">
                {String(factor.order).padStart(2, "0")}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{factor.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/50">{factor.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="border-t border-white/10 pt-3 text-[11px] leading-relaxed text-white/30">
        {PROBABILISTIC_DISCLAIMER}
      </p>
      <Link
        href="/support"
        className="text-xs font-semibold text-brand-400 transition-colors hover:text-brand-300"
      >
        Comprendre notre modèle →
      </Link>
    </div>
  );
}
