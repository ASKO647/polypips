import type { Metadata } from "next";
import { MarketsFlow } from "@/components/dashboard/markets/markets-flow";

export const metadata: Metadata = {
  title: "Marchés sélectionnés — Polypips",
};

export default function MarketsPage() {
  return <MarketsFlow />;
}
