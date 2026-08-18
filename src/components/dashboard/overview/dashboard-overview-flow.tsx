"use client";

import { useState } from "react";
import { GraduationCap, LineChart, Sparkles, Wallet } from "lucide-react";
import { AnalysisResult } from "@/components/dashboard/analyse-ia/analysis-result";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { TrialBanner } from "@/components/dashboard/overview/trial-banner";
import { QuickAccessCard } from "@/components/dashboard/overview/quick-access-card";
import { RecentMarketsSection } from "@/components/dashboard/overview/recent-markets-section";
import { UsageWidget } from "@/components/dashboard/overview/usage-widget";
import { RecentActivitySection } from "@/components/dashboard/overview/recent-activity-section";
import type { MarketAnalysis } from "@/lib/data/analysis";
import type { NotificationItem } from "@/lib/data/notifications";

export function DashboardOverviewFlow({
  hasActiveSubscription,
  cancelled,
  trialEndsAt,
  analysesToday,
  dailyAnalysisLimit,
  selectedMarketsCount,
  walletsFollowed,
  walletsMax,
  conversationCount,
  coachMessagesThisWeek,
  weeklyCoachLimit,
  recentMarkets,
  notifications,
}: {
  hasActiveSubscription: boolean;
  /** True when access is blocked because the user cancelled — swaps the
   * "Débutez pour 0,99 €" first-time CTA for a "réabonnez-vous" one. */
  cancelled: boolean;
  /** ISO end-of-trial date, only while genuinely still trialing (not
   * cancelled) — TrialBanner recomputes the days-remaining count itself
   * client-side so it keeps ticking down without a page reload. */
  trialEndsAt: string | null;
  analysesToday: number;
  dailyAnalysisLimit: number | null;
  selectedMarketsCount: number;
  walletsFollowed: number;
  walletsMax: number | null;
  conversationCount: number;
  coachMessagesThisWeek: number;
  weeklyCoachLimit: number | null;
  recentMarkets: MarketAnalysis[];
  notifications: NotificationItem[];
}) {
  const [selectedMarket, setSelectedMarket] = useState<MarketAnalysis | null>(
    null
  );

  if (selectedMarket) {
    return (
      <AnalysisResult
        analysis={selectedMarket}
        onBack={() => setSelectedMarket(null)}
        backLabel="Retour au tableau de bord"
        locked={!hasActiveSubscription}
      />
    );
  }

  const analysesRemaining =
    dailyAnalysisLimit !== null
      ? `${Math.max(dailyAnalysisLimit - analysesToday, 0)}`
      : "∞";
  const coachMessagesRemaining =
    weeklyCoachLimit !== null
      ? `${Math.max(weeklyCoachLimit - coachMessagesThisWeek, 0)}`
      : "∞";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Tableau de bord
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Vue d&apos;ensemble de votre activité et de vos accès rapides.
        </p>
      </div>

      {trialEndsAt !== null && !cancelled && <TrialBanner trialEndsAt={trialEndsAt} />}

      <LockedOverlay
        locked={!hasActiveSubscription}
        cancelled={cancelled}
        message={
          cancelled
            ? "Abonnement annulé — réabonnez-vous pour continuer à utiliser le tableau de bord."
            : "Débloquez le tableau de bord complet — Débutez pour 0,99 €"
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAccessCard
            href="/dashboard/analyse-ia"
            icon={Sparkles}
            title="Analyse IA"
            stat={
              dailyAnalysisLimit !== null
                ? `${analysesToday}/${dailyAnalysisLimit} aujourd'hui`
                : "Analyses illimitées"
            }
            tone="brand"
          />
          <QuickAccessCard
            href="/dashboard/markets"
            icon={LineChart}
            title="Marchés sélectionnés"
            stat={`${selectedMarketsCount} marché${selectedMarketsCount > 1 ? "s" : ""} sélectionné${selectedMarketsCount > 1 ? "s" : ""}`}
            tone="emerald"
          />
          <QuickAccessCard
            href="/dashboard/smart-money"
            icon={Wallet}
            title="Smart Money"
            stat={
              walletsMax !== null
                ? `${walletsFollowed}/${walletsMax} wallets suivis`
                : `${walletsFollowed} wallet${walletsFollowed > 1 ? "s" : ""} suivi${walletsFollowed > 1 ? "s" : ""}`
            }
            tone="amber"
          />
          <QuickAccessCard
            href="/dashboard/coach"
            icon={GraduationCap}
            title="Coach IA"
            stat={`${conversationCount} conversation${conversationCount > 1 ? "s" : ""}`}
            tone="neutral"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentMarketsSection
              markets={recentMarkets}
              onSelect={setSelectedMarket}
            />
          </div>
          <UsageWidget
            analysesRemaining={analysesRemaining}
            walletsFollowed={String(walletsFollowed)}
            walletsMax={walletsMax !== null ? String(walletsMax) : "∞"}
            coachMessagesRemaining={coachMessagesRemaining}
          />
        </div>
      </LockedOverlay>

      <RecentActivitySection notifications={notifications} />
    </div>
  );
}
