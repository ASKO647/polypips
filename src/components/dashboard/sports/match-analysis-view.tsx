import { Link } from "@/i18n/navigation";
import { ArrowLeft, Share2 } from "lucide-react";
import { AnalysisTabs } from "@/components/dashboard/sports/analysis-tabs";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { MatchActions } from "@/components/dashboard/sports/match-actions";
import { MatchBreadcrumb } from "@/components/dashboard/sports/match-breadcrumb";
import { MatchHeader } from "@/components/dashboard/sports/match-header";
import { OddsComparator } from "@/components/dashboard/sports/odds-comparator";
import { OpportunitiesRow } from "@/components/dashboard/sports/opportunities-row";
import { PopularMarketsTabs } from "@/components/dashboard/sports/popular-markets-tabs";
import { ProbabilitiesCard } from "@/components/dashboard/sports/probabilities-card";
import { VerdictCard } from "@/components/dashboard/sports/verdict-card";
import type { MatchAnalysis } from "@/lib/sports/types";

export function MatchAnalysisView({
  analysis,
  hasActiveSubscription,
}: {
  analysis: MatchAnalysis;
  hasActiveSubscription: boolean;
}) {
  const { match } = analysis;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/sports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Retour
        </Link>
        <MatchBreadcrumb match={match} />
      </div>

      <MatchHeader match={match} />

      <LockedOverlay
        locked={!hasActiveSubscription}
        message="Débloquez les probabilités, le verdict IA et l'analyse complète de ce match."
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="lg:flex-[3]">
              <ProbabilitiesCard
                match={match}
                probabilities={analysis.probabilities}
                confidenceScore={analysis.verdict.confidenceScore}
              />
            </div>
            <div className="lg:flex-[2]">
              <VerdictCard verdict={analysis.verdict} />
            </div>
          </div>

          <OpportunitiesRow opportunities={analysis.opportunities} />

          <AnalysisTabs analysis={analysis} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <OddsComparator match={match} odds={analysis.odds} />
            <PopularMarketsTabs markets={analysis.popularMarkets} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <MatchActions />
            <button
              type="button"
              aria-label="Partager ce match"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50 transition-colors hover:text-white"
            >
              <Share2 className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </LockedOverlay>
    </div>
  );
}
