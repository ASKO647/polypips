import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { PlaceholderSection } from "@/components/dashboard/placeholder-section";

export const metadata: Metadata = {
  title: "Smart Money — Polypips",
};

export default function SmartMoneyPage() {
  return (
    <PlaceholderSection
      icon={Wallet}
      title="Smart Money"
      description="Suivez les mouvements des portefeuilles les plus performants et repérez les tendances avant le marché."
    />
  );
}
