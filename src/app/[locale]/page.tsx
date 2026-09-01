import type { Metadata } from "next";
import { BatipilotHeader } from "@/components/batipilot/header";
import { BatipilotHero } from "@/components/batipilot/hero";
import { AgentsSection } from "@/components/batipilot/agents-section";
import { AutomationSection } from "@/components/batipilot/automation-section";
import { PricingSection } from "@/components/batipilot/pricing-section";
import { HowItWorksSection } from "@/components/batipilot/how-it-works-section";
import { BatipilotFooter } from "@/components/batipilot/footer";

export const metadata: Metadata = {
  title: "BatiPilot — L'IA qui pilote votre entreprise BTP",
  description:
    "BatiPilot automatise la gestion de chantiers, le standard téléphonique, les dossiers d'aides, la relance commerciale, les appels d'offres et le marketing des entreprises du BTP.",
};

export default function Home() {
  return (
    <div className="bg-[#04060d] text-white">
      <BatipilotHeader />
      <main>
        <BatipilotHero />
        <AgentsSection />
        <AutomationSection />
        <PricingSection />
        <HowItWorksSection />
      </main>
      <BatipilotFooter />
    </div>
  );
}
