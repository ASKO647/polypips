import type { Metadata } from "next";
import { OverviewFlow } from "@/components/dashboard/sports/overview-flow";
import { getOverviewStats } from "@/lib/sports/service";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription, hasActiveAccess } from "@/lib/supabase/subscriptions";

export const metadata: Metadata = {
  title: "Sports — Polypips",
};

export default async function SportsOverviewPage() {
  const supabase = await createClient();
  const [stats, subscription] = await Promise.all([
    getOverviewStats(),
    fetchSubscription(supabase),
  ]);

  return <OverviewFlow stats={stats} hasActiveSubscription={hasActiveAccess(subscription)} />;
}
