import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { DashboardOverviewFlow } from "@/components/dashboard/overview/dashboard-overview-flow";
import { CheckoutIntentRedirect } from "@/components/dashboard/checkout-intent-redirect";
import { DashboardEntryRedirect } from "@/components/dashboard/dashboard-entry-redirect";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { fetchUserSettings, isResumeLastSessionActive } from "@/lib/supabase/user-settings";
import {
  fetchSubscription,
  getEffectivePlan,
  hasActiveAccess,
} from "@/lib/supabase/subscriptions";
import {
  countAnalysesToday,
  countAnalysesAllTime,
  fetchAnalysisTimestamps,
} from "@/lib/supabase/analyses";
import { fetchSelectedMarkets, countSelectedMarkets } from "@/lib/supabase/selected-markets";
import { fetchNotifications } from "@/lib/supabase/notifications";
import {
  countFollowedWallets,
  fetchWalletFollowTimestamps,
} from "@/lib/supabase/wallets";
import {
  countSportAnalysesToday,
  countSportAnalysesAllTime,
  fetchSportAnalysisTimestamps,
} from "@/lib/supabase/sports-analyses";
import {
  countTradingAnalysesToday,
  countTradingAnalysesAllTime,
  fetchTradingAnalysisTimestamps,
} from "@/lib/supabase/trading-analyses";
import {
  fetchResolvedAnalyses,
  computePerformanceStats,
} from "@/lib/supabase/performance";
import { getDailyAnalysisLimit, getMaxTrackedWallets } from "@/lib/data/pricing";
import { bucketCountsByDay, getFirstNameFromUser } from "@/lib/utils";
import type { ActivityPeriodKey, ActivityPeriodCounts } from "@/components/dashboard/overview/activity-donut";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard");
  return { title: t("metaTitle") };
}

/** Window fetched for both the 7-day sparklines and the "30 jours" donut
 * period — the "7 jours" period is derived from the same fetch (summing
 * its last 7 daily buckets) rather than a second query. */
const ACTIVITY_WINDOW_DAYS = 30;
const SPARKLINE_DAYS = 7;

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    return (
      <Suspense fallback={null}>
        <CheckoutIntentRedirect />
      </Suspense>
    );
  }

  const [subscription, plan, settings] = await Promise.all([
    fetchSubscription(supabase),
    getEffectivePlan(supabase, user.id),
    fetchUserSettings(supabase),
  ]);

  const maxTrackedWallets = getMaxTrackedWallets(plan);

  const [
    analysesToday,
    recentMarkets,
    selectedMarketsCount,
    notifications,
    analysisTimestamps,
    analysesAllTime,
    walletFollowTimestamps,
    walletsFollowedTotal,
    resolvedAnalyses,
    sportAnalysesToday,
    sportAnalysisTimestamps,
    sportAnalysesAllTime,
    tradingAnalysesToday,
    tradingAnalysisTimestamps,
    tradingAnalysesAllTime,
  ] = await Promise.all([
    countAnalysesToday(supabase, user.id),
    fetchSelectedMarkets(supabase, 5),
    countSelectedMarkets(supabase),
    fetchNotifications(supabase, 5),
    fetchAnalysisTimestamps(supabase, user.id, ACTIVITY_WINDOW_DAYS),
    countAnalysesAllTime(supabase, user.id),
    fetchWalletFollowTimestamps(supabase, user.id, ACTIVITY_WINDOW_DAYS),
    countFollowedWallets(supabase, user.id),
    fetchResolvedAnalyses(supabase, user.id),
    countSportAnalysesToday(supabase, user.id),
    fetchSportAnalysisTimestamps(supabase, user.id, ACTIVITY_WINDOW_DAYS),
    countSportAnalysesAllTime(supabase, user.id),
    countTradingAnalysesToday(supabase, user.id),
    fetchTradingAnalysisTimestamps(supabase, user.id, ACTIVITY_WINDOW_DAYS),
    countTradingAnalysesAllTime(supabase, user.id),
  ]);

  const analysesSparkline = bucketCountsByDay(analysisTimestamps, SPARKLINE_DAYS);
  const walletsSparkline = bucketCountsByDay(walletFollowTimestamps, SPARKLINE_DAYS);
  const sportSparkline = bucketCountsByDay(sportAnalysisTimestamps, SPARKLINE_DAYS);
  const tradingSparkline = bucketCountsByDay(tradingAnalysisTimestamps, SPARKLINE_DAYS);

  const activityPeriods: Record<ActivityPeriodKey, ActivityPeriodCounts> = {
    "7j": {
      analyses: sum(analysesSparkline),
      wallets: sum(walletsSparkline),
      sport: sum(sportSparkline),
      trading: sum(tradingSparkline),
    },
    "30j": {
      analyses: analysisTimestamps.length,
      wallets: walletFollowTimestamps.length,
      sport: sportAnalysisTimestamps.length,
      trading: tradingAnalysisTimestamps.length,
    },
    tout: {
      analyses: analysesAllTime,
      wallets: walletsFollowedTotal,
      sport: sportAnalysesAllTime,
      trading: tradingAnalysesAllTime,
    },
  };

  return (
    <>
      <Suspense fallback={null}>
        <CheckoutIntentRedirect />
      </Suspense>
      <DashboardEntryRedirect resumeActive={isResumeLastSessionActive(settings)} startPage={settings.startPage} />
      <DashboardOverviewFlow
        firstName={getFirstNameFromUser(user)}
        hasActiveSubscription={hasActiveAccess(subscription)}
        subscription={subscription}
        plan={plan}
        analysesToday={analysesToday}
        dailyAnalysisLimit={getDailyAnalysisLimit(plan)}
        selectedMarketsCount={selectedMarketsCount}
        walletsFollowed={walletsFollowedTotal}
        walletsMax={maxTrackedWallets}
        sportAnalysesToday={sportAnalysesToday}
        tradingAnalysesToday={tradingAnalysesToday}
        recentMarkets={recentMarkets}
        notifications={notifications}
        analysesSparkline={analysesSparkline}
        walletsSparkline={walletsSparkline}
        sportSparkline={sportSparkline}
        tradingSparkline={tradingSparkline}
        activityPeriods={activityPeriods}
        performanceStats={computePerformanceStats(resolvedAnalyses)}
      />
    </>
  );
}
