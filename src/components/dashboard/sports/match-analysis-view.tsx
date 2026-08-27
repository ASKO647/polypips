import { Link } from "@/i18n/navigation";
import { ArrowLeft, Share2 } from "lucide-react";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { FollowMatchButton } from "@/components/dashboard/sports/follow-match-button";
import { MatchBreadcrumb } from "@/components/dashboard/sports/match-breadcrumb";
import { MatchCenterTabs } from "@/components/dashboard/sports/match-center-tabs";
import { MatchHeader } from "@/components/dashboard/sports/match-header";
import type { MatchAnalysis } from "@/lib/sports/types";

export function MatchAnalysisView({
  analysis,
  hasActiveSubscription,
  matchFollowed,
  homeTeamFollowed,
  awayTeamFollowed,
}: {
  analysis: MatchAnalysis;
  hasActiveSubscription: boolean;
  matchFollowed: boolean;
  homeTeamFollowed: boolean;
  awayTeamFollowed: boolean;
}) {
  const { match } = analysis;
  const matchLabel = `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/sports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Retour
          </Link>
          <MatchBreadcrumb match={match} />
        </div>

        <div className="flex items-center gap-2">
          <FollowMatchButton
            matchId={match.id}
            matchLabel={matchLabel}
            initialFollowed={matchFollowed}
          />
          <button
            type="button"
            aria-label="Partager ce match"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50 transition-colors hover:text-white"
          >
            <Share2 className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      <MatchHeader match={match} homeFollowed={homeTeamFollowed} awayFollowed={awayTeamFollowed} />

      <LockedOverlay
        locked={!hasActiveSubscription}
        message="Débloquez le Polypips Score, l'analyse IA et le détail complet de ce match."
      >
        <MatchCenterTabs analysis={analysis} />
      </LockedOverlay>
    </div>
  );
}
