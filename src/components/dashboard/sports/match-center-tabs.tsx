"use client";

import { useState } from "react";
import { AnalysePolypipsCard } from "@/components/dashboard/sports/analyse-polypips-card";
import { CompositionsTab } from "@/components/dashboard/sports/compositions-tab";
import { FormeTab } from "@/components/dashboard/sports/forme-tab";
import { FormPanel } from "@/components/dashboard/sports/form-panel";
import { H2HTab } from "@/components/dashboard/sports/h2h-tab";
import { MarchesTab } from "@/components/dashboard/sports/marches-tab";
import { MatchInfoCard } from "@/components/dashboard/sports/match-info-card";
import { OddsComparator } from "@/components/dashboard/sports/odds-comparator";
import { OpportunitiesPanel } from "@/components/dashboard/sports/opportunities-panel";
import { PolypipsScoreCard } from "@/components/dashboard/sports/polypips-score-card";
import { StatsTab } from "@/components/dashboard/sports/stats-tab";
import type { MatchAnalysis } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

type TabKey = "overview" | "stats" | "forme" | "h2h" | "compositions" | "marches" | "cotes";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Vue d'ensemble" },
  { key: "stats", label: "Stats" },
  { key: "forme", label: "Forme" },
  { key: "h2h", label: "H2H" },
  { key: "compositions", label: "Compositions" },
  { key: "marches", label: "Marchés" },
  { key: "cotes", label: "Cotes" },
];

export function MatchCenterTabs({ analysis }: { analysis: MatchAnalysis }) {
  const [tab, setTab] = useState<TabKey>("overview");
  const {
    match,
    polypipsScore,
    analysisFactors,
    opportunities,
    form,
    recentResults,
    comparison,
    h2h,
    info,
    odds,
    popularMarkets,
    marketEdges,
    lineups,
    injuries,
  } = analysis;

  return (
    <div className="flex flex-col gap-5">
      <div className="-mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "shrink-0 snap-start rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150",
              tab === t.key
                ? "border-brand-400 bg-brand-500/15 text-brand-400"
                : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <PolypipsScoreCard breakdown={polypipsScore} />
            <AnalysePolypipsCard factors={analysisFactors} />
          </div>
          <div className="flex flex-col gap-4">
            <OpportunitiesPanel opportunities={opportunities} />
            <FormPanel match={match} home={form.home} away={form.away} />
            <MatchInfoCard match={match} info={info} />
          </div>
        </div>
      )}

      {tab === "stats" && <StatsTab match={match} comparison={comparison} />}

      {tab === "forme" && <FormeTab match={match} form={form} recentResults={recentResults} />}

      {tab === "h2h" && <H2HTab match={match} h2h={h2h} />}

      {tab === "compositions" && (
        <CompositionsTab match={match} lineups={lineups} injuries={injuries} />
      )}

      {tab === "marches" && (
        <MarchesTab popularMarkets={popularMarkets} marketEdges={marketEdges} />
      )}

      {tab === "cotes" && <OddsComparator match={match} odds={odds} />}
    </div>
  );
}
