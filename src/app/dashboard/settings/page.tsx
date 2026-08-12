import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PlaceholderSection } from "@/components/dashboard/placeholder-section";

export const metadata: Metadata = {
  title: "Paramètres — Polypips",
};

export default function SettingsPage() {
  return (
    <PlaceholderSection
      icon={Settings}
      title="Paramètres"
      description="Gérez votre compte, votre abonnement et vos préférences de notification."
    />
  );
}
