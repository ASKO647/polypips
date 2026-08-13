import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StatsEmptyState() {
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
