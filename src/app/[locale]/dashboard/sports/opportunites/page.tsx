import type { Metadata } from "next";
import { OpportunitiesFlow } from "@/components/dashboard/sports/opportunities-flow";
import { listCompetitions } from "@/lib/sports/service";

export const metadata: Metadata = {
  title: "Opportunités — Sports — Polypips",
};

export default async function SportsOpportunitiesPage() {
  const competitions = await listCompetitions();
  return <OpportunitiesFlow competitions={competitions} />;
}
