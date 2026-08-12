import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { PlaceholderSection } from "@/components/dashboard/placeholder-section";

export const metadata: Metadata = {
  title: "Statistiques — Polypips",
};

export default function StatsPage() {
  return (
    <PlaceholderSection
      icon={BarChart3}
      title="Statistiques"
      description="Visualisez vos performances, votre taux de réussite et l'évolution de vos gains dans le temps."
    />
  );
}
