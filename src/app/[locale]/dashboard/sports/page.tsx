import type { Metadata } from "next";
import { OverviewFlow } from "@/components/dashboard/sports/overview-flow";
import { getOverviewStats, listUpcomingMatches } from "@/lib/sports/service";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription, hasActiveAccess } from "@/lib/supabase/subscriptions";

export const metadata: Metadata = {
  title: "Sports — Polypips",
};

export default async function SportsOverviewPage() {
  const supabase = await createClient();
  const [stats, matches, subscription] = await Promise.all([
    getOverviewStats(),
    listUpcomingMatches(),
    fetchSubscription(supabase),
  ]);

  return (
    <OverviewFlow
      stats={stats}
      matches={matches}
      hasActiveSubscription={hasActiveAccess(subscription)}
    />
  );
}
