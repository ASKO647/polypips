import type { Metadata } from "next";
import { PolymarketTradesFlow } from "@/components/dashboard/copy-trading/polymarket-trades-flow";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import {
  fetchSubscription,
  hasActiveAccess,
  isCancelledSubscription,
} from "@/lib/supabase/subscriptions";
import { fetchAllSuggestions } from "@/lib/supabase/copy-trading";

export const metadata: Metadata = {
  title: "Mes trades copiés — Polypips",
};

export default async function PolymarketPositionsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  const [suggestions, subscription] = await Promise.all([
    user ? fetchAllSuggestions(supabase, user.id) : Promise.resolve([]),
    fetchSubscription(supabase),
  ]);

  return (
    <PolymarketTradesFlow
      suggestions={suggestions}
      hasActiveSubscription={hasActiveAccess(subscription)}
      cancelled={isCancelledSubscription(subscription)}
    />
  );
}
