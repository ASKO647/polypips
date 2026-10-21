import type { Metadata } from "next";
import { TradingAnalysesHistory } from "@/components/dashboard/trading/trading-analyses-history";
import { createClient } from "@/lib/supabase/server";
import { fetchRecentTradingAnalyses } from "@/lib/supabase/trading-analyses";

export const metadata: Metadata = {
  title: "Trading — Mes analyses — Polypips",
};

export default async function TradingMesAnalysesPage() {
  const supabase = await createClient();
  const analyses = await fetchRecentTradingAnalyses(supabase, 50);

  return <TradingAnalysesHistory analyses={analyses} />;
}
