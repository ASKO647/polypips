import type { Metadata } from "next";
import { BarChart3, Gauge, Target, TrendingUp } from "lucide-react";
import { AccuracyEvolutionChart } from "@/components/dashboard/stats/accuracy-evolution-chart";
import { AnalysisHistoryList } from "@/components/dashboard/stats/analysis-history-list";
import { CategoryTable } from "@/components/dashboard/stats/category-table";
import { DecisionSplit } from "@/components/dashboard/stats/decision-split";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { StatCard } from "@/components/dashboard/stats/stat-card";
import { StatsEmptyState } from "@/components/dashboard/stats/stats-empty-state";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import {
  fetchSubscription,
  hasActiveAccess,
  isCancelledSubscription,
} from "@/lib/supabase/subscriptions";
import {
  fetchResolvedAnalyses,
  countUnresolvedAnalyses,
  computeKeyStats,
  computeDecisionSplit,
  computeCategoryStats,
  computeAccuracyEvolutionPeriods,
  toResolvedAnalysisHistory,
} from "@/lib/supabase/performance";

export const metadata: Metadata = {
  title: "Statistiques — Polypips",
};

export default async function StatsPage() {
  const supabase = await createClient();
  const [subscription, user] = await Promise.all([
    fetchSubscription(supabase),
    getAuthUser(),
  ]);
  const locked = !hasActiveAccess(subscription);
  const cancelled = isCancelledSubscription(subscription);

  const [resolvedAnalyses, unresolvedCount] = user
    ? await Promise.all([
        fetchResolvedAnalyses(supabase, user.id),
        countUnresolvedAnalyses(supabase, user.id),
      ])
    : [[], 0];

  const keyStats = computeKeyStats(resolvedAnalyses);
  const decisionSplit = computeDecisionSplit(resolvedAnalyses);
  const categoryStats = computeCategoryStats(resolvedAnalyses);
  const evolutionPeriods = computeAccuracyEvolutionPeriods(resolvedAnalyses);
  const history = toResolvedAnalysisHistory(resolvedAnalyses);

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

      {/* "Pas d'abonnement" (locked, this overlay) is distinct from "abonné
       * mais historique encore vide" (StatsEmptyState rendered unblurred
       * below) — the two must never look the same. */}
      <LockedOverlay
        locked={locked}
        cancelled={cancelled}
        message={
          cancelled
            ? "Abonnement annulé — réabonnez-vous pour continuer à utiliser les statistiques."
            : "Débloquez les statistiques détaillées — Débutez pour 0,99 €"
        }
      >
        {resolvedAnalyses.length === 0 ? (
          <StatsEmptyState />
        ) : (
          <>
            <p className="text-xs leading-relaxed text-white/35">
              Précision réelle des décisions de l&apos;IA sur vos analyses
              dont le marché s&apos;est résolu — indépendamment de si vous
              avez réellement parié.
              {unresolvedCount > 0 &&
                ` ${unresolvedCount} analyse${unresolvedCount > 1 ? "s" : ""} en attente de résolution du marché.`}
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatCard
                icon={BarChart3}
                value={String(keyStats.totalAnalyses)}
                label="Analyses résolues"
              />
              <StatCard
                icon={Target}
                value={`${keyStats.precision}%`}
                label="Précision réelle"
              />
              <StatCard
                icon={TrendingUp}
                value={`${keyStats.averageEdge >= 0 ? "+" : ""}${keyStats.averageEdge}%`}
                label="Edge moyen"
              />
              <StatCard
                icon={Gauge}
                value={`${keyStats.averageOpportunityScore}/100`}
                label="Score moyen d'opportunité"
              />
            </div>

            <AccuracyEvolutionChart periods={evolutionPeriods} />

            {decisionSplit && <DecisionSplit split={decisionSplit} />}

            {categoryStats.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                  Statistiques par catégorie
                </p>
                <CategoryTable rows={categoryStats} />
              </div>
            )}

            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                Historique des analyses résolues
              </p>
              <AnalysisHistoryList items={history} />
            </div>
          </>
        )}
      </LockedOverlay>
    </div>
  );
}
