import type { Metadata } from "next";
import { MarketsFlow } from "@/components/dashboard/markets/markets-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription, hasActiveAccess } from "@/lib/supabase/subscriptions";

export const metadata: Metadata = {
  title: "Marchés sélectionnés — Polypips",
};

export default async function MarketsPage() {
  const supabase = await createClient();
  const subscription = await fetchSubscription(supabase);

  return <MarketsFlow hasActiveSubscription={hasActiveAccess(subscription)} />;
}
