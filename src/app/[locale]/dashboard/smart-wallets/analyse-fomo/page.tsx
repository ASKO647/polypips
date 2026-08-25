import type { Metadata } from "next";
import { SignalAnalysisFlow } from "@/components/dashboard/smart-wallets/signal-analysis/signal-analysis-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription, hasActiveAccess } from "@/lib/supabase/subscriptions";

export const metadata: Metadata = {
  title: "Analyse AI Fomo — Polypips",
};

/** Own dedicated page (not a tab on the Polymarket Analyse IA page — that
 * page stays exclusively Polymarket's) — same input/output experience as
 * Polymarket's Analyse IA, adapted to Fomo memecoin trades. See
 * SignalAnalysisFlow's own comment for why this is a distinct pipeline. */
export default async function AnalyseFomoPage() {
  const supabase = await createClient();
  const subscription = await fetchSubscription(supabase);

  return <SignalAnalysisFlow source="fomo" hasActiveSubscription={hasActiveAccess(subscription)} />;
}
