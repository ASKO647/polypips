import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompetitionMatches } from "@/components/dashboard/sports/competition-matches";
import { getSportCategory } from "@/lib/sports/nav";
import { getCompetitionById, listUpcomingMatches } from "@/lib/sports/service";
import type { SportKey } from "@/lib/sports/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; competitionId: string }>;
}): Promise<Metadata> {
  const { competitionId } = await params;
  const competition = await getCompetitionById(competitionId);
  return { title: competition ? `${competition.name} — Sports — Polypips` : "Sports — Polypips" };
}

export default async function CompetitionMatchesPage({
  params,
}: {
  params: Promise<{ sport: string; competitionId: string }>;
}) {
  const { sport, competitionId } = await params;
  const category = getSportCategory(sport);
  if (!category || !category.active) notFound();

  const competition = await getCompetitionById(competitionId);
  if (!competition || competition.sport !== category.key) notFound();

  const matches = await listUpcomingMatches({ competitionId });

  return (
    <CompetitionMatches sport={category.key as SportKey} competition={competition} matches={matches} />
  );
}
