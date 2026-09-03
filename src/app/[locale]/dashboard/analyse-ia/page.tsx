import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AnalyseIaFlow } from "@/components/dashboard/analyse-ia/analyse-ia-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchRecentAnalyses } from "@/lib/supabase/analyses";
import { fetchSubscription, hasActiveAccess } from "@/lib/supabase/subscriptions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Polymarket.AnalyseIa");
  return { title: t("metaTitle") };
}

export default async function AnalyseIaPage() {
  const supabase = await createClient();
  const [recentAnalyses, subscription] = await Promise.all([
    fetchRecentAnalyses(supabase),
    fetchSubscription(supabase),
  ]);

  return (
    <AnalyseIaFlow
      initialRecentAnalyses={recentAnalyses}
      hasActiveSubscription={hasActiveAccess(subscription)}
    />
  );
}
