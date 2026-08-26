import { ArrowDown, ShieldCheck } from "lucide-react";
import { PIPELINE_STAGES } from "@/lib/data/signal-how-it-works";

/** Purely explanatory — no props, no live state. Mirrors the real stages
 * in sync-signal-wallets/index.ts, ending on "vous décidez" rather than
 * an execution step, since none exists. */
export function PipelineDiagram() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-bold text-white sm:text-xl">
          Ce qui se passe automatiquement
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/55">
          Une fois le Copy Trading activé sur un Smart Wallet, ce pipeline tourne à chaque
          synchronisation, sans action de votre part — jusqu&apos;à la notification.
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

      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3.5">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" strokeWidth={2} />
        <p className="text-xs leading-relaxed text-emerald-200/90">
          PolyPips s&apos;arrête à la notification : aucun ordre n&apos;est jamais passé
          automatiquement, sur aucune plateforme, et aucune clé privée n&apos;est jamais demandée
          ou stockée.
        </p>
      </div>
    </div>
  );
}
