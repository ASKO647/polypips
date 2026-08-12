import type { Metadata } from "next";
import { Copy } from "lucide-react";
import { PlaceholderSection } from "@/components/dashboard/placeholder-section";

export const metadata: Metadata = {
  title: "Copy Trading — Polypips",
};

export default function CopyTradingPage() {
  return (
    <PlaceholderSection
      icon={Copy}
      title="Copy Trading"
      description="Reproduisez automatiquement les positions des traders les plus performants suivis par Polypips."
    />
  );
}
