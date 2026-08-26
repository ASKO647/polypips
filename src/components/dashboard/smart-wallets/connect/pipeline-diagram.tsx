import { ArrowDown, FlaskConical } from "lucide-react";
import { PIPELINE_STAGES } from "@/lib/data/fomo-axiom-connect";

/** Purely explanatory — no props, no live state. Mirrors the exact stage
 * names from the brief so a user can map this diagram directly onto what
 * they see happen in "Trades copiés". */
export function PipelineDiagram() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-bold text-white sm:text-xl">
          Ce qui se passe automatiquement
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/55">
          Une fois le Copy Trading activé sur un Smart Wallet, ce pipeline tourne à chaque
          synchronisation, sans action de votre part.
        </p>
      </div>

      <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        {PIPELINE_STAGES.map((stage, i) => (
          <div key={stage} className="flex flex-col items-center gap-1.5">
            <div className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-2.5 text-center text-sm font-bold text-white">
              {stage}
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <ArrowDown className="h-4 w-4 text-white/25" strokeWidth={2} />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3.5">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" strokeWidth={2} />
        <p className="text-xs leading-relaxed text-amber-200/90">
          &quot;EXÉCUTION&quot; s&apos;effectue aujourd&apos;hui uniquement en mode démo — aucune
          transaction réelle n&apos;est envoyée sur la blockchain, et aucune clé privée n&apos;est
          jamais demandée ou stockée par PolyPips.
        </p>
      </div>
    </div>
  );
}
