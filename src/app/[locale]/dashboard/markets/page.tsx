import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketsFlow } from "@/components/dashboard/markets/markets-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription, hasActiveAccess } from "@/lib/supabase/subscriptions";
import {
  fetchLastMarketsSyncedAt,
  fetchSelectedMarkets,
} from "@/lib/supabase/selected-markets";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Polymarket.Markets");
  return { title: t("metaTitle") };
}

export default async function MarketsPage() {
  const supabase = await createClient();
  const [subscription, markets, lastSyncedAt] = await Promise.all([
    fetchSubscription(supabase),
    fetchSelectedMarkets(supabase),
    fetchLastMarketsSyncedAt(supabase),
  ]);

  return (
    <MarketsFlow
      markets={markets}
      hasActiveSubscription={hasActiveAccess(subscription)}
      lastSyncedAt={lastSyncedAt}
    />
  );
}
