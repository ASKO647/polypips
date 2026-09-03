"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Dashboard.Overview");
  const [selectedMarket, setSelectedMarket] = useState<MarketAnalysis | null>(
    null
  );

  if (selectedMarket) {
    return (
      <AnalysisResult
        analysis={selectedMarket}
        onBack={() => setSelectedMarket(null)}
        backLabel={t("backToDashboard")}
        locked={!hasActiveSubscription}
      />
    );
  }

  const lockedMessage = cancelled ? t("lockedCancelled") : t("lockedDefault");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-dash-text sm:text-3xl">
          {firstName ? t("greeting", { name: firstName }) : t("greetingNoName")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-dash-text-tertiary sm:text-base">
          {t("subtitle")}
        </p>
      </div>

      <LockedOverlay locked={!hasActiveSubscription} cancelled={cancelled} message={lockedMessage}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAccessCard
            href="/dashboard/analyse-ia"
            icon={Sparkles}
            title={t("cards.analyseIAPolymarket.title")}
            stat={
              dailyAnalysisLimit !== null
                ? t("cards.analyseIAPolymarket.statLimited", {
                    today: analysesToday,
                    limit: dailyAnalysisLimit,
                  })
                : t("cards.analyseIAPolymarket.statUnlimited")
            }
            tone="brand"
            sparklinePoints={analysesSparkline}
          />
          <QuickAccessCard
            href="/dashboard/markets"
            icon={LineChart}
            title={t("cards.marchesSelectionnes.title")}
            stat={t("cards.marchesSelectionnes.stat", { count: selectedMarketsCount })}
            tone="sky"
          />
          <QuickAccessCard
            href="/dashboard/copy-trading"
            icon={Wallet}
            title={t("cards.smartWallet.title")}
            stat={
              walletsMax !== null
                ? t("cards.smartWallet.statWithMax", { followed: walletsFollowed, max: walletsMax })
                : t("cards.smartWallet.statNoMax", { count: walletsFollowed })
            }
            tone="emerald"
            sparklinePoints={walletsSparkline}
          />
          <QuickAccessCard
            href="/dashboard/sports"
            icon={Trophy}
            title={t("cards.analyseIASport.title")}
            stat={t("cards.analyseIASport.stat", { count: sportAnalysesToday })}
            tone="violet"
            sparklinePoints={sportSparkline}
          />
          <QuickAccessCard
            href="/dashboard/trading"
            icon={CandlestickChart}
            title={t("cards.analyseIATrading.title")}
            stat={t("cards.analyseIATrading.stat", { count: tradingAnalysesToday })}
            tone="amber"
            sparklinePoints={tradingSparkline}
          />
          <QuickAccessCard
            href="/dashboard/coach"
            icon={GraduationCap}
            title={t("cards.coachIA.title")}
            stat={t("cards.coachIA.stat", { count: conversationCount })}
            tone="rose"
            sparklinePoints={coachSparkline}
          />
          <QuickAccessCard
            href="/dashboard/community"
            icon={Users}
            title={t("cards.communaute.title")}
            stat={t("cards.communaute.stat", { count: groupsJoinedCount })}
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
