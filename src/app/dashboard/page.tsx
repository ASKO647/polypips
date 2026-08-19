import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardOverviewFlow } from "@/components/dashboard/overview/dashboard-overview-flow";
import { CheckoutIntentRedirect } from "@/components/dashboard/checkout-intent-redirect";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import {
  fetchSubscription,
  getEffectivePlan,
  getTrialEndsAt,
  hasActiveAccess,
  isCancelledSubscription,
} from "@/lib/supabase/subscriptions";
import {
  countAnalysesToday,
  countAnalysesAllTime,
  fetchAnalysisTimestamps,
} from "@/lib/supabase/analyses";
import { fetchSelectedMarkets } from "@/lib/supabase/selected-markets";
import {
  countConversations,
  countCoachMessagesAllTime,
  fetchCoachMessageTimestamps,
} from "@/lib/supabase/coach";
import { fetchNotifications } from "@/lib/supabase/notifications";
import {
  countFollowedWallets,
  fetchWalletFollowTimestamps,
} from "@/lib/supabase/wallets";
import {
  fetchResolvedAnalyses,
  computePerformanceStats,
} from "@/lib/supabase/performance";
import { getDailyAnalysisLimit, getMaxTrackedWallets } from "@/lib/data/pricing";
import { bucketCountsByDay, getFirstNameFromUser } from "@/lib/utils";
import type { ActivityPeriodKey, ActivityPeriodCounts } from "@/components/dashboard/overview/activity-donut";

export const metadata: Metadata = {
  title: "Tableau de bord — Polypips",
};

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

  const [subscription, plan] = await Promise.all([
    fetchSubscription(supabase),
    getEffectivePlan(supabase, user.id),
  ]);

  const maxTrackedWallets = getMaxTrackedWallets(plan);

  const [
    analysesToday,
    recentMarkets,
    conversationCount,
    notifications,
    analysisTimestamps,
    analysesAllTime,
    walletFollowTimestamps,
    walletsFollowedTotal,
    coachMessageTimestamps,
    coachMessagesAllTime,
    resolvedAnalyses,
  ] = await Promise.all([
    countAnalysesToday(supabase, user.id),
    fetchSelectedMarkets(supabase, 5),
    countConversations(supabase),
    fetchNotifications(supabase, 5),
    fetchAnalysisTimestamps(supabase, user.id, ACTIVITY_WINDOW_DAYS),
    countAnalysesAllTime(supabase, user.id),
    fetchWalletFollowTimestamps(supabase, user.id, ACTIVITY_WINDOW_DAYS),
    countFollowedWallets(supabase, user.id),
    fetchCoachMessageTimestamps(supabase, user.id, ACTIVITY_WINDOW_DAYS),
    countCoachMessagesAllTime(supabase, user.id),
    fetchResolvedAnalyses(supabase, user.id),
  ]);

  const analysesSparkline = bucketCountsByDay(analysisTimestamps, SPARKLINE_DAYS);
  const smartMoneySparkline = bucketCountsByDay(walletFollowTimestamps, SPARKLINE_DAYS);
  const coachSparkline = bucketCountsByDay(coachMessageTimestamps, SPARKLINE_DAYS);

  const activityPeriods: Record<ActivityPeriodKey, ActivityPeriodCounts> = {
    "7j": {
      analyses: sum(analysesSparkline),
      smartMoney: sum(smartMoneySparkline),
      coach: sum(coachSparkline),
    },
    "30j": {
      analyses: analysisTimestamps.length,
      smartMoney: walletFollowTimestamps.length,
      coach: coachMessageTimestamps.length,
    },
    tout: {
      analyses: analysesAllTime,
      smartMoney: walletsFollowedTotal,
      coach: coachMessagesAllTime,
    },
  };

  return (
    <>
      <Suspense fallback={null}>
        <CheckoutIntentRedirect />
      </Suspense>
      <DashboardOverviewFlow
        firstName={getFirstNameFromUser(user)}
        hasActiveSubscription={hasActiveAccess(subscription)}
        cancelled={isCancelledSubscription(subscription)}
        trialEndsAt={getTrialEndsAt(subscription)}
        subscription={subscription}
        plan={plan}
        analysesToday={analysesToday}
        dailyAnalysisLimit={getDailyAnalysisLimit(plan)}
        walletsFollowed={walletsFollowedTotal}
        walletsMax={maxTrackedWallets}
        conversationCount={conversationCount}
        recentMarkets={recentMarkets}
        notifications={notifications}
        analysesSparkline={analysesSparkline}
        smartMoneySparkline={smartMoneySparkline}
        coachSparkline={coachSparkline}
        activityPeriods={activityPeriods}
        performanceStats={computePerformanceStats(resolvedAnalyses)}
      />
    </>
  );
}
