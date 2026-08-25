import type { Metadata } from "next";
import { SignalAnalysisFlow } from "@/components/dashboard/smart-wallets/signal-analysis/signal-analysis-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription, hasActiveAccess } from "@/lib/supabase/subscriptions";

export const metadata: Metadata = {
  title: "Analyse AI Axiom — Polypips",
};

/** Own dedicated page — same input/output experience as Polymarket's
 * Analyse IA and as Analyse AI Fomo, adapted to Axiom memecoin trades.
 * See SignalAnalysisFlow's own comment for the shared pipeline. */
export default async function AnalyseAxiomPage() {
  const supabase = await createClient();
  const subscription = await fetchSubscription(supabase);

  return <SignalAnalysisFlow source="axiom" hasActiveSubscription={hasActiveAccess(subscription)} />;
}
