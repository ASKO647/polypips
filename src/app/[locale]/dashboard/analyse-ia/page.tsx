import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AnalyseIaFlow } from "@/components/dashboard/analyse-ia/analyse-ia-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchRecentAnalyses } from "@/lib/supabase/analyses";
import { fetchSubscription, hasActiveAccess } from "@/lib/supabase/subscriptions";
import { fetchCreditBalance } from "@/lib/supabase/credits";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Polymarket.AnalyseIa");
  return { title: t("metaTitle") };
}

export default async function AnalyseIaPage() {
  const supabase = await createClient();
  const [recentAnalyses, subscription, creditBalance] = await Promise.all([
    fetchRecentAnalyses(supabase),
    fetchSubscription(supabase),
    fetchCreditBalance(supabase),
  ]);

  return (
    <AnalyseIaFlow
      initialRecentAnalyses={recentAnalyses}
      hasActiveSubscription={hasActiveAccess(subscription)}
      creditBalance={creditBalance}
    />
  );
}
