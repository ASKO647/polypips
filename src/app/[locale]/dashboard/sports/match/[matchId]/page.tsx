import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatchAnalysisView } from "@/components/dashboard/sports/match-analysis-view";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { fetchSubscription, hasActiveAccess } from "@/lib/supabase/subscriptions";
import { fetchFollowedMatchIds, fetchFollowedTeamIds } from "@/lib/supabase/sports-follows";
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
  const [analysis, subscription, user] = await Promise.all([
    getMatchAnalysis(matchId),
    fetchSubscription(supabase),
    getAuthUser(),
  ]);

  if (!analysis) notFound();

  const [followedMatchIds, followedTeamIds] = await Promise.all([
    fetchFollowedMatchIds(supabase, user?.id ?? null),
    fetchFollowedTeamIds(supabase, user?.id ?? null),
  ]);

  return (
    <MatchAnalysisView
      analysis={analysis}
      hasActiveSubscription={hasActiveAccess(subscription)}
      matchFollowed={followedMatchIds.has(matchId)}
      homeTeamFollowed={followedTeamIds.has(analysis.match.homeTeam.id)}
      awayTeamFollowed={followedTeamIds.has(analysis.match.awayTeam.id)}
    />
  );
}
