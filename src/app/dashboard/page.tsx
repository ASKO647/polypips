import type { Metadata } from "next";
import { Suspense } from "react";
import { AnalyseIaFlow } from "@/components/dashboard/analyse-ia/analyse-ia-flow";
import { CheckoutIntentRedirect } from "@/components/dashboard/checkout-intent-redirect";
import { createClient } from "@/lib/supabase/server";
import { fetchRecentAnalyses } from "@/lib/supabase/analyses";
import { fetchSubscription, hasActiveAccess } from "@/lib/supabase/subscriptions";

export const metadata: Metadata = {
  title: "Analyse IA — Polypips",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const [recentAnalyses, subscription] = await Promise.all([
    fetchRecentAnalyses(supabase),
    fetchSubscription(supabase),
  ]);

  return (
    <>
      <Suspense fallback={null}>
        <CheckoutIntentRedirect />
      </Suspense>
      <AnalyseIaFlow
        initialRecentAnalyses={recentAnalyses}
        hasActiveSubscription={hasActiveAccess(subscription)}
      />
    </>
  );
}
