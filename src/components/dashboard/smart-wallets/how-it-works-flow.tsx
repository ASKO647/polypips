import { ShieldAlert } from "lucide-react";
import { CopyTradingActivationSteps } from "@/components/dashboard/smart-wallets/how-it-works/copy-trading-activation-steps";
import { HowItWorksFaq } from "@/components/dashboard/smart-wallets/how-it-works/how-it-works-faq";
import { HowItWorksSteps } from "@/components/dashboard/smart-wallets/how-it-works/how-it-works-steps";
import { PipelineDiagram } from "@/components/dashboard/smart-wallets/how-it-works/pipeline-diagram";

function SectionDivider() {
  return <div className="h-px w-full bg-white/10" />;
}

/**
 * "Comment ça marche" — replaces the earlier connection-tutorial page.
 * There is no Fomo/Axiom connection or authorization step: PolyPips
 * watches followed Smart Wallets' public activity and notifies you with
 * a real link to the platform, exactly like Polymarket's own Copy
 * Trading (watch + alert, never automatic execution). See
 * sync-signal-wallets/index.ts for the real pipeline this describes.
 */
export function HowItWorksFlow({ hasActiveCopyTrading }: { hasActiveCopyTrading: boolean }) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Comment ça marche
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50 sm:text-base">
          Le Copy Trading Fomo X Axiom en quatre étapes simples — vous suivez, PolyPips surveille
          et vous notifie, vous décidez toujours vous-même.
        </p>
      </div>

      <HowItWorksSteps />
      <SectionDivider />
      <PipelineDiagram />
      <SectionDivider />
      <CopyTradingActivationSteps hasActiveCopyTrading={hasActiveCopyTrading} />

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-white sm:text-xl">Questions fréquentes</h2>
        <HowItWorksFaq />
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" strokeWidth={2} />
        <p className="text-xs leading-relaxed text-white/55">
          PolyPips ne vous demandera jamais votre seed phrase, votre clé privée, votre mot de passe
          Axiom/Fomo, ou toute autre information secrète non nécessaire. Aucune clé privée n&apos;est
          stockée, en clair ou chiffrée. PolyPips ne trade jamais à votre place et ne détient
          jamais vos fonds.
        </p>
      </div>
    </div>
  );
}
