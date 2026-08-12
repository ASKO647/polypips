import type { Metadata } from "next";
import { LineChart } from "lucide-react";
import { PlaceholderSection } from "@/components/dashboard/placeholder-section";

export const metadata: Metadata = {
  title: "Marchés sélectionnés — Polypips",
};

export default function MarketsPage() {
  return (
    <PlaceholderSection
      icon={LineChart}
      title="Marchés sélectionnés"
      description="Retrouvez ici la sélection de marchés Polymarket identifiés par notre IA comme présentant le meilleur signal."
    />
  );
}
