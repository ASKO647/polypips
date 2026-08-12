import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { PlaceholderSection } from "@/components/dashboard/placeholder-section";

export const metadata: Metadata = {
  title: "Analyse IA — Polypips",
};

export default function DashboardPage() {
  return (
    <PlaceholderSection
      icon={Sparkles}
      title="Analyse IA"
      description="Vos analyses de marchés générées par IA s'afficheront ici : décision, probabilité et score d'opportunité pour chaque question suivie."
    />
  );
}
