import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { PlaceholderSection } from "@/components/dashboard/placeholder-section";

export const metadata: Metadata = {
  title: "Coach IA — Polypips",
};

export default function CoachPage() {
  return (
    <PlaceholderSection
      icon={GraduationCap}
      title="Coach IA"
      description="Posez vos questions à votre coach IA personnel et obtenez des explications sur chaque analyse de marché."
    />
  );
}
