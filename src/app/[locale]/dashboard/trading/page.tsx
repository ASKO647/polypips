import type { Metadata } from "next";
import { TradingAnalyseIaFlow } from "@/components/dashboard/trading/trading-analyse-ia-flow";

export const metadata: Metadata = {
  title: "Trading — Analyse IA — Polypips",
};

export default function TradingAnalyseIaPage() {
  return <TradingAnalyseIaFlow />;
}
