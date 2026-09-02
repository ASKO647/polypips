import { BarChart3, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Rendered whenever there are zero RESOLVED analyses — which is not the
 * same thing as zero analyses. A user can have done 10+ real analyses
 * whose Polymarket markets simply haven't closed yet (resolve-markets only
 * fills in resolved/resolved_outcome once a market genuinely resolves —
 * see lib/supabase/performance.ts's file comment); showing "Commencez
 * votre première analyse" to that user would be actively wrong, since
 * they already have. `unresolvedCount` (from countUnresolvedAnalyses)
 * distinguishes the two cases so the copy is always honest about which one
 * this actually is.
 */
export function StatsEmptyState({ unresolvedCount = 0 }: { unresolvedCount?: number }) {
  if (unresolvedCount > 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05]">
          <Clock className="h-6 w-6 text-white/30" />
        </span>
        <div className="flex flex-col gap-1.5">
          <p className="font-display text-lg font-bold text-white">
            {unresolvedCount} analyse{unresolvedCount > 1 ? "s" : ""} en attente de résolution
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-white/50">
            Vos statistiques (précision réelle, edge moyen...) s&apos;affichent une fois que le
            marché Polymarket d&apos;une analyse se résout — pas avant, pour ne jamais estimer une
            précision sur un résultat encore inconnu.
          </p>
        </div>
        <Button href="/dashboard/analyse-ia" size="md" className="mt-1">
          Lancer une nouvelle analyse
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05]">
        <BarChart3 className="h-6 w-6 text-white/30" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="font-display text-lg font-bold text-white">
          Aucune donnée pour le moment
        </p>
        <p className="max-w-sm text-sm leading-relaxed text-white/50">
          Commencez votre première analyse pour voir vos statistiques
          apparaître ici.
        </p>
      </div>
      <Button href="/dashboard/analyse-ia" size="md" className="mt-1">
        Lancer une analyse
      </Button>
    </div>
  );
}
