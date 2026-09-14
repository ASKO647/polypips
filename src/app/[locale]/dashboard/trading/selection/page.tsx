import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TradingSelectionFlow } from "@/components/dashboard/trading/trading-selection-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription, hasActiveAccess } from "@/lib/supabase/subscriptions";
import {
  fetchLastTradingSyncedAt,
  fetchSelectedTradingAnalyses,
} from "@/lib/supabase/selected-trading-analyses";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Trading.Selection");
  return { title: t("metaTitle") };
}

export default async function TradingSelectionPage() {
  const supabase = await createClient();
  const [subscription, analyses, lastSyncedAt] = await Promise.all([
    fetchSubscription(supabase),
    fetchSelectedTradingAnalyses(supabase),
    fetchLastTradingSyncedAt(supabase),
  ]);

  return (
    <TradingSelectionFlow
      analyses={analyses}
      hasActiveSubscription={hasActiveAccess(subscription)}
      lastSyncedAt={lastSyncedAt}
    />
  );
}
