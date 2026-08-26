import { ShieldAlert } from "lucide-react";
import { ConnectionsStatusCard } from "@/components/dashboard/smart-wallets/connect/connections-status-card";
import { CopyTradingActivationSteps } from "@/components/dashboard/smart-wallets/connect/copy-trading-activation-steps";
import { FomoAxiomFaq } from "@/components/dashboard/smart-wallets/connect/fomo-axiom-faq";
import { PipelineDiagram } from "@/components/dashboard/smart-wallets/connect/pipeline-diagram";
import { PlatformConnectSection } from "@/components/dashboard/smart-wallets/connect/platform-connect-section";
import { CONNECT_PLATFORMS } from "@/lib/data/fomo-axiom-connect";

function SectionDivider() {
  return <div className="h-px w-full bg-white/10" />;
}

/**
 * "Comment connecter PolyPips à Fomo & Axiom" — the full connection guide
 * for the Fomo X Axiom universe. Axiom (axiom.trade) and Fomo
 * (fomo.family) are both real, verified platforms with no public
 * third-party API today (see lib/data/fomo-axiom-connect.ts's file
 * comment for the research behind that) — every "connect" step here is
 * honest about that limit rather than faking an authorization flow.
 * Following Smart Wallets and activating Copy Trading (in demo mode) are
 * both real and already shipped, so Part 3 onward describes actual UI.
 */
export function TutorialFlow({ hasActiveCopyTrading }: { hasActiveCopyTrading: boolean }) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Comment connecter PolyPips à Fomo &amp; Axiom
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50 sm:text-base">
          Ce que vous devez connecter, pourquoi, comment procéder, comment vérifier que ça
          fonctionne, puis comment activer le Copy Trading.
        </p>
      </div>

      <PlatformConnectSection platform={CONNECT_PLATFORMS.axiom} />
      <SectionDivider />
      <PlatformConnectSection platform={CONNECT_PLATFORMS.fomo} />
      <SectionDivider />
      <CopyTradingActivationSteps hasActiveCopyTrading={hasActiveCopyTrading} />
      <SectionDivider />
      <PipelineDiagram />
      <ConnectionsStatusCard hasActiveCopyTrading={hasActiveCopyTrading} />

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-white sm:text-xl">Questions fréquentes</h2>
        <FomoAxiomFaq />
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" strokeWidth={2} />
        <p className="text-xs leading-relaxed text-white/55">
          PolyPips ne vous demandera jamais votre seed phrase, votre clé privée, votre mot de passe
          Axiom/Fomo, ou toute autre information secrète non nécessaire. Aucune clé privée n&apos;est
          stockée, en clair ou chiffrée. L&apos;exécution des trades reste en mode démo tant
          qu&apos;aucun mécanisme d&apos;exécution officiellement supporté n&apos;est connecté.
        </p>
      </div>
    </div>
  );
}
