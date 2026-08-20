"use client";

import { useState } from "react";
import { AiSummaryCard } from "@/components/dashboard/sports/ai-summary-card";
import { H2HAdvancedCard } from "@/components/dashboard/sports/h2h-advanced";
import { H2HListCard } from "@/components/dashboard/sports/h2h-list";
import { InjuriesView } from "@/components/dashboard/sports/injuries-view";
import { LineupsView } from "@/components/dashboard/sports/lineups-view";
import { MatchInfoCard } from "@/components/dashboard/sports/match-info-card";
import { TeamComparisonCard } from "@/components/dashboard/sports/team-comparison";
import { TeamFormCard } from "@/components/dashboard/sports/team-form";
import type { MatchAnalysis } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

type TabKey = "overview" | "stats" | "h2h" | "lineups" | "injuries" | "h2h-advanced";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Analyse détaillée" },
  { key: "stats", label: "Stats" },
  { key: "h2h", label: "Face à face" },
  { key: "lineups", label: "Compositions probables" },
  { key: "injuries", label: "Blessés / Absents" },
  { key: "h2h-advanced", label: "H2H avancé" },
];

export function AnalysisTabs({ analysis }: { analysis: MatchAnalysis }) {
  const [tab, setTab] = useState<TabKey>("overview");
  const { match, form, comparison, h2h, aiSummary, info, lineups, injuries } = analysis;

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
          <div className="flex flex-col gap-4">
            <TeamFormCard match={match} home={form.home} away={form.away} />
            <AiSummaryCard summary={aiSummary} />
          </div>
          <div className="lg:row-span-2">
            <TeamComparisonCard match={match} stats={comparison} />
          </div>
          <div className="flex flex-col gap-4">
            <H2HListCard h2h={h2h} limit={5} />
            <MatchInfoCard match={match} info={info} />
          </div>
        </div>
      )}

      {tab === "stats" && (
        <div className="flex flex-col gap-4">
          <TeamComparisonCard match={match} stats={comparison} />
          <TeamFormCard match={match} home={form.home} away={form.away} />
        </div>
      )}

      {tab === "h2h" && <H2HListCard h2h={h2h} title="Historique des confrontations" />}

      {tab === "lineups" && <LineupsView match={match} lineups={lineups} />}

      {tab === "injuries" && <InjuriesView match={match} injuries={injuries} />}

      {tab === "h2h-advanced" && <H2HAdvancedCard match={match} h2h={h2h} />}
    </div>
  );
}
