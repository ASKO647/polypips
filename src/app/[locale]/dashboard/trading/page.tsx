import type { Metadata } from "next";
import { TradingAnalyseIaFlow } from "@/components/dashboard/trading/trading-analyse-ia-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchCreditBalance } from "@/lib/supabase/credits";

export const metadata: Metadata = {
  title: "Trading — Analyse IA — Polypips",
};

export default async function TradingAnalyseIaPage() {
  const supabase = await createClient();
  const creditBalance = await fetchCreditBalance(supabase);
  return <TradingAnalyseIaFlow creditBalance={creditBalance} />;
}
