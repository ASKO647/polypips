import type { Metadata } from "next";
import { BarChart3, Gauge, Target, TrendingUp } from "lucide-react";
import { AccuracyEvolutionChart } from "@/components/dashboard/stats/accuracy-evolution-chart";
import { AnalysisHistoryList } from "@/components/dashboard/stats/analysis-history-list";
import { CategoryTable } from "@/components/dashboard/stats/category-table";
import { DecisionSplit } from "@/components/dashboard/stats/decision-split";
import { StatCard } from "@/components/dashboard/stats/stat-card";
import { StatsEmptyState } from "@/components/dashboard/stats/stats-empty-state";
import { IS_DEMO_MODE } from "@/lib/config/demo-mode";
import {
  CATEGORY_STATS,
  DECISION_SPLIT,
  KEY_STATS,
  RESOLVED_ANALYSES,
} from "@/lib/data/stats";

export const metadata: Metadata = {
  title: "Statistiques — Polypips",
};

export default function StatsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Statistiques
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Suivez vos performances et l&apos;évolution de vos analyses.
        </p>
      </div>

      {IS_DEMO_MODE ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              icon={BarChart3}
              value={String(KEY_STATS.totalAnalyses)}
              label="Analyses réalisées"
            />
            <StatCard
              icon={Target}
              value={`${KEY_STATS.precision}%`}
              label="Précision historique"
            />
            <StatCard
              icon={TrendingUp}
              value={`+${KEY_STATS.averageEdge}%`}
              label="Edge moyen"
            />
            <StatCard
              icon={Gauge}
              value={`${KEY_STATS.averageOpportunityScore}/100`}
              label="Score moyen d'opportunité"
            />
          </div>

          <AccuracyEvolutionChart />

          <DecisionSplit split={DECISION_SPLIT} />

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Statistiques par catégorie
            </p>
            <CategoryTable rows={CATEGORY_STATS} />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Historique des analyses
            </p>
            <AnalysisHistoryList items={RESOLVED_ANALYSES} />
          </div>
        </>
      ) : (
        <StatsEmptyState />
      )}
    </div>
  );
}
