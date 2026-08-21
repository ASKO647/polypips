import type { Metadata } from "next";
import { OverviewFlow } from "@/components/dashboard/sports/overview-flow";
import { getOverviewStats, listUpcomingMatches } from "@/lib/sports/service";

export const metadata: Metadata = {
  title: "Sports — Polypips",
};

export default async function SportsOverviewPage() {
  const [stats, matches] = await Promise.all([getOverviewStats(), listUpcomingMatches()]);

  return <OverviewFlow stats={stats} matches={matches} />;
}
