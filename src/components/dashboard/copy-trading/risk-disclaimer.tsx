import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function RiskDisclaimer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-4 py-3",
        className
      )}
    >
      <ShieldAlert
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
        strokeWidth={2}
      />
      <p className="text-xs leading-relaxed text-amber-100/70">
        Le copy trading comporte des risques. Les performances passées ne
        préjugent pas des performances futures. Polypips fonctionne en mode
        simulation : aucun ordre n&apos;est jamais exécuté automatiquement à
        votre place, sur aucun marché.
      </p>
    </div>
  );
}
