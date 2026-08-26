import { CheckCircle2 } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { COPY_TRADING_ACTIVATION_STEPS } from "@/lib/data/signal-how-it-works";
import { cn } from "@/lib/utils";

/** Every step here is real and already shipped — see wallet-card.tsx,
 * my-smart-wallets-flow.tsx and copy-settings-form.tsx for the exact UI
 * this describes. */
export function CopyTradingActivationSteps({ hasActiveCopyTrading }: { hasActiveCopyTrading: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-bold text-white sm:text-xl">
          Activer le Copy Trading
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/55">
          Suivre des Smart Wallets et activer le Copy Trading fonctionne dès aujourd&apos;hui — ça
          ne fait jamais plus que vous notifier.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {COPY_TRADING_ACTIVATION_STEPS.map((step, i) => {
          const isLast = i === COPY_TRADING_ACTIVATION_STEPS.length - 1;
          return (
            <div key={step.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] font-display text-sm font-bold text-white/50">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <p className="font-display text-base font-bold text-white">{step.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{step.description}</p>
                {isLast && (
                  <div
                    className={cn(
                      "mt-3.5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold",
                      hasActiveCopyTrading ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.06] text-white/45"
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                    {hasActiveCopyTrading ? "🟢 Copy Trading actif" : "Pas encore activé"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row">
        <Button href="/dashboard/smart-wallets" className="sm:flex-1">
          Ouvrir Smart Wallet
          <ButtonIcon>→</ButtonIcon>
        </Button>
        <Button href="/dashboard/smart-wallets/suivis" variant="outline" className="sm:flex-1">
          Aller à Mes Smart Wallets
        </Button>
      </div>
    </div>
  );
}
