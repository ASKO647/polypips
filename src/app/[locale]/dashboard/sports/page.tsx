import type { Metadata } from "next";
import { OverviewFlow } from "@/components/dashboard/sports/overview-flow";
import { getAuthUser } from "@/lib/supabase/server";
import { getOverviewStats, listUpcomingMatches } from "@/lib/sports/service";
import { getFirstNameFromUser } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sports — Polypips",
};

export default async function SportsOverviewPage() {
  const [user, stats, matches] = await Promise.all([
    getAuthUser(),
    getOverviewStats(),
    listUpcomingMatches(),
  ]);

  return (
    <OverviewFlow firstName={getFirstNameFromUser(user)} stats={stats} matches={matches} />
  );
}
