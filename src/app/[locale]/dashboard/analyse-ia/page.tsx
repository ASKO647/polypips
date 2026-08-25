import type { Metadata } from "next";
import { AnalyseIaTabs } from "@/components/dashboard/analyse-ia/analyse-ia-tabs";
import { createClient } from "@/lib/supabase/server";
import { fetchRecentAnalyses } from "@/lib/supabase/analyses";
import { fetchSubscription, hasActiveAccess } from "@/lib/supabase/subscriptions";

export const metadata: Metadata = {
  title: "Analyse IA — Polypips",
};

export default async function AnalyseIaPage() {
  const supabase = await createClient();
  const [recentAnalyses, subscription] = await Promise.all([
    fetchRecentAnalyses(supabase),
    fetchSubscription(supabase),
  ]);

  return (
    <AnalyseIaTabs
      initialRecentAnalyses={recentAnalyses}
      hasActiveSubscription={hasActiveAccess(subscription)}
    />
  );
}
