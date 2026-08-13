import type { Metadata } from "next";
import { MarketsFlow } from "@/components/dashboard/markets/markets-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription, hasActiveAccess } from "@/lib/supabase/subscriptions";
import { fetchSelectedMarkets } from "@/lib/supabase/selected-markets";

export const metadata: Metadata = {
  title: "Marchés sélectionnés — Polypips",
};

export default async function MarketsPage() {
  const supabase = await createClient();
  const [subscription, markets] = await Promise.all([
    fetchSubscription(supabase),
    fetchSelectedMarkets(supabase),
  ]);

  return (
    <MarketsFlow
      markets={markets}
      hasActiveSubscription={hasActiveAccess(subscription)}
    />
  );
}
