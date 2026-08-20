import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatchAnalysisView } from "@/components/dashboard/sports/match-analysis-view";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription, hasActiveAccess } from "@/lib/supabase/subscriptions";
import { getMatchAnalysis } from "@/lib/sports/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ matchId: string }>;
}): Promise<Metadata> {
  const { matchId } = await params;
  const analysis = await getMatchAnalysis(matchId);
  if (!analysis) return { title: "Match — Polypips" };
  return {
    title: `${analysis.match.homeTeam.shortName} vs ${analysis.match.awayTeam.shortName} — Polypips`,
  };
}

export default async function SportsMatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const supabase = await createClient();
  const [analysis, subscription] = await Promise.all([
    getMatchAnalysis(matchId),
    fetchSubscription(supabase),
  ]);

  if (!analysis) notFound();

  return (
    <MatchAnalysisView analysis={analysis} hasActiveSubscription={hasActiveAccess(subscription)} />
  );
}
