import type { Metadata } from "next";
import { SportsFlow } from "@/components/dashboard/sports/sports-flow";
import { listCompetitions, listUpcomingMatches } from "@/lib/sports/service";

export const metadata: Metadata = {
  title: "Sports — Polypips",
};

export default async function SportsPage() {
  const [matches, competitions] = await Promise.all([
    listUpcomingMatches(),
    listCompetitions(),
  ]);

  return <SportsFlow matches={matches} competitions={competitions} />;
}
