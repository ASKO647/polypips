import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CoachFlow } from "@/components/dashboard/coach/coach-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchConversationSummaries } from "@/lib/supabase/coach";
import { fetchAnalysisById } from "@/lib/supabase/analyses";
import {
  fetchSubscription,
  hasActiveAccess,
  isCancelledSubscription,
} from "@/lib/supabase/subscriptions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Coach");
  return { title: t("metaTitle") };
}

export default async function CoachPage({
  searchParams,
}: PageProps<"/[locale]/dashboard/coach">) {
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
      cancelled={isCancelledSubscription(subscription)}
    />
  );
}
