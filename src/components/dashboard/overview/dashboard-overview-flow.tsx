"use client";

import { useState } from "react";
import {
  CandlestickChart,
  GraduationCap,
  LineChart,
  Sparkles,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { AnalysisResult } from "@/components/dashboard/analyse-ia/analysis-result";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { QuickAccessCard } from "@/components/dashboard/overview/quick-access-card";
import { SubscriptionQuickCard } from "@/components/dashboard/overview/subscription-quick-card";
import { MarketsTable } from "@/components/dashboard/overview/markets-table";
import { RecentActivitySection } from "@/components/dashboard/overview/recent-activity-section";
import {
  ActivityDonut,
  type ActivityPeriodCounts,
  type ActivityPeriodKey,
} from "@/components/dashboard/overview/activity-donut";
import { PerformanceCard } from "@/components/dashboard/overview/performance-card";
import type { MarketAnalysis } from "@/lib/data/analysis";
import type { NotificationItem } from "@/lib/data/notifications";
import type { PricingPlan } from "@/lib/data/pricing";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";
import type { PerformanceStats } from "@/lib/supabase/performance";

export function DashboardOverviewFlow({
  firstName,
  hasActiveSubscription,
  cancelled,
  subscription,
  plan,
  analysesToday,
  dailyAnalysisLimit,
  selectedMarketsCount,
  walletsFollowed,
  walletsMax,
  sportAnalysesToday,
  tradingAnalysesToday,
  conversationCount,
  groupsJoinedCount,
  recentMarkets,
  notifications,
  analysesSparkline,
  walletsSparkline,
  sportSparkline,
  tradingSparkline,
  coachSparkline,
  activityPeriods,
  performanceStats,
}: {
  /** Real first name from user_metadata (Google OAuth only) — null for
   * plain email/password accounts, which never collect a name. */
  firstName: string | null;
  hasActiveSubscription: boolean;
  /** True when access is blocked because the user cancelled — swaps the
   * "Débutez pour 0,99 €" first-time CTA for a "réabonnez-vous" one. */
  cancelled: boolean;
  subscription: SubscriptionRow | null;
  plan: PricingPlan;
  analysesToday: number;
  dailyAnalysisLimit: number | null;
  /** Total rows currently in selected_markets — shared across all users
   * (scan-markets' own picks), not a personal count. */
  selectedMarketsCount: number;
  walletsFollowed: number;
  walletsMax: number | null;
  sportAnalysesToday: number;
  tradingAnalysesToday: number;
  conversationCount: number;
  /** Community groups this user is currently a member of (real count from
   * community_group_members via fetchMyGroups). */
  groupsJoinedCount: number;
  recentMarkets: MarketAnalysis[];
  notifications: NotificationItem[];
  /** Real daily counts (oldest→newest, 7 days) for each quick-access
   * card's sparkline — all-zero when there's no real activity. */
  analysesSparkline: number[];
  walletsSparkline: number[];
  sportSparkline: number[];
  tradingSparkline: number[];
  coachSparkline: number[];
  activityPeriods: Record<ActivityPeriodKey, ActivityPeriodCounts>;
  /** null (or resolvedCount === 0) until resolve-markets has confirmed at
   * least one real market outcome for this user — PerformanceCard renders
   * its honest empty state in that case. */
  performanceStats: PerformanceStats | null;
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

  const lockedMessage = cancelled
    ? "Abonnement annulé — réabonnez-vous pour continuer à utiliser le tableau de bord."
    : "Débloquez le tableau de bord complet — Débutez pour 0,99 €";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-dash-text sm:text-3xl">
          {firstName ? `Bonjour, ${firstName} 👋` : "Bonjour 👋"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-dash-text-tertiary sm:text-base">
          Vue d&apos;ensemble de votre activité et de vos accès rapides.
        </p>
      </div>

      <LockedOverlay locked={!hasActiveSubscription} cancelled={cancelled} message={lockedMessage}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAccessCard
            href="/dashboard/analyse-ia"
            icon={Sparkles}
            title="Analyse IA Polymarket"
            stat={
              dailyAnalysisLimit !== null
                ? `${analysesToday}/${dailyAnalysisLimit} aujourd'hui`
                : "Analyses illimitées"
            }
            tone="brand"
            sparklinePoints={analysesSparkline}
          />
          <QuickAccessCard
            href="/dashboard/markets"
            icon={LineChart}
            title="Marchés sélectionnés"
            stat={`${selectedMarketsCount} marché${selectedMarketsCount > 1 ? "s" : ""} sélectionné${selectedMarketsCount > 1 ? "s" : ""}`}
            tone="sky"
          />
          <QuickAccessCard
            href="/dashboard/copy-trading"
            icon={Wallet}
            title="Smart Wallet"
            stat={
              walletsMax !== null
                ? `${walletsFollowed}/${walletsMax} wallets suivis`
                : `${walletsFollowed} wallet${walletsFollowed > 1 ? "s" : ""} suivi${walletsFollowed > 1 ? "s" : ""}`
            }
            tone="emerald"
            sparklinePoints={walletsSparkline}
          />
          <QuickAccessCard
            href="/dashboard/sports"
            icon={Trophy}
            title="Analyse IA Sport"
            stat={`${sportAnalysesToday} analyse${sportAnalysesToday > 1 ? "s" : ""} aujourd'hui`}
            tone="violet"
            sparklinePoints={sportSparkline}
          />
          <QuickAccessCard
            href="/dashboard/trading"
            icon={CandlestickChart}
            title="Analyse IA Trading"
            stat={`${tradingAnalysesToday} analyse${tradingAnalysesToday > 1 ? "s" : ""} aujourd'hui`}
            tone="amber"
            sparklinePoints={tradingSparkline}
          />
          <QuickAccessCard
            href="/dashboard/coach"
            icon={GraduationCap}
            title="Coach IA"
            stat={`${conversationCount} conversation${conversationCount > 1 ? "s" : ""}`}
            tone="rose"
            sparklinePoints={coachSparkline}
          />
          <QuickAccessCard
            href="/dashboard/community"
            icon={Users}
            title="Communauté"
            stat={`${groupsJoinedCount} groupe${groupsJoinedCount > 1 ? "s" : ""} rejoint${groupsJoinedCount > 1 ? "s" : ""}`}
            tone="neutral"
          />
          <SubscriptionQuickCard subscription={subscription} plan={plan} />
        </div>
      </LockedOverlay>

      {/* Left and right are independent flex-col stacks, not cells of a
       * single CSS Grid row — a shared row's auto-height always equals its
       * tallest cell, which previously left dead space below whichever
       * column (MarketsTable vs. the right stack) happened to be shorter,
       * before RecentActivitySection appeared. Each column now grows to
       * its own real content height. MarketsTable and the right column
       * each get their own LockedOverlay (instead of one overlay spanning
       * the whole left column) so RecentActivitySection — deliberately
       * ungated, see the "Fix subscription gating gaps" audit — can sit
       * right below MarketsTable without also being blurred. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <LockedOverlay locked={!hasActiveSubscription} cancelled={cancelled} message={lockedMessage}>
            <MarketsTable markets={recentMarkets} onSelect={setSelectedMarket} />
          </LockedOverlay>
          <RecentActivitySection notifications={notifications} />
        </div>

        <LockedOverlay
          locked={!hasActiveSubscription}
          cancelled={cancelled}
          message={lockedMessage}
          contentClassName="flex flex-col gap-4"
        >
          <ActivityDonut periods={activityPeriods} />
          <PerformanceCard stats={performanceStats} />
        </LockedOverlay>
      </div>
    </div>
  );
}
