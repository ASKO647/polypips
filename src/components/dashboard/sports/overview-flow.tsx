"use client";

import { BarChart3, Flame, ShieldCheck, Target } from "lucide-react";
import { SportsAnalysisFlow } from "@/components/dashboard/sports/ai-analysis/sports-analysis-flow";
import { StatTile } from "@/components/dashboard/sports/stat-tile";
import { TeamSearchPanel } from "@/components/dashboard/sports/team-search-panel";
import type { SportsOverviewStats } from "@/lib/sports/types";

export function OverviewFlow({
  stats,
  hasActiveSubscription,
}: {
  stats: SportsOverviewStats;
  hasActiveSubscription: boolean;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Sports
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Votre aperçu sportif du jour — probabilités, statistiques et analyse IA.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={BarChart3}
          label="Matchs analysés aujourd'hui"
          value={stats.matchesAnalyzedToday}
        />
        <StatTile
          icon={Flame}
          label="Opportunités détectées"
          value={stats.opportunitiesDetectedToday}
          tone="brand"
        />
        <StatTile
          icon={Target}
          label="Fortes convictions"
          value={stats.highConvictionCount}
          caption="Confiance ≥ 60%"
        />
        <StatTile
          icon={ShieldCheck}
          label="Précision modèle"
          value={stats.modelAccuracy.precisionPercent === null ? null : `${stats.modelAccuracy.precisionPercent}%`}
          caption={
            stats.modelAccuracy.precisionPercent === null
              ? "Pas encore de données"
              : `${stats.modelAccuracy.windowDays} derniers jours`
          }
          tone="emerald"
        />
      </div>

      <TeamSearchPanel />

      <SportsAnalysisFlow hasActiveSubscription={hasActiveSubscription} />
    </div>
  );
}
