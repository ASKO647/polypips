import type { Metadata } from "next";
import { CompetitionsFlow } from "@/components/dashboard/sports/competitions-flow";
import { listCompetitions } from "@/lib/sports/service";

export const metadata: Metadata = {
  title: "Compétitions — Sports — Polypips",
};

export default async function SportsCompetitionsPage() {
  const competitions = await listCompetitions();
  return <CompetitionsFlow competitions={competitions} />;
}
