import type { Metadata } from "next";
import { CoachFlow } from "@/components/dashboard/coach/coach-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchConversationSummaries } from "@/lib/supabase/coach";
import { fetchAnalysisById } from "@/lib/supabase/analyses";
import { fetchSubscription, hasActiveAccess } from "@/lib/supabase/subscriptions";

export const metadata: Metadata = {
  title: "Coach IA — Polypips",
};

export default async function CoachPage({
  searchParams,
}: PageProps<"/dashboard/coach">) {
  const { analysisId } = await searchParams;
  const supabase = await createClient();

  const [conversations, focusAnalysis, subscription] = await Promise.all([
    fetchConversationSummaries(supabase),
    typeof analysisId === "string" ? fetchAnalysisById(supabase, analysisId) : null,
    fetchSubscription(supabase),
  ]);

  return (
    <CoachFlow
      initialConversations={conversations}
      initialFocusAnalysis={
        focusAnalysis ? { id: focusAnalysis.id, question: focusAnalysis.question } : null
      }
      hasActiveSubscription={hasActiveAccess(subscription)}
    />
  );
}
