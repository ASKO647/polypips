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
import { countAnalysesToday } from "@/lib/supabase/analyses";
import { fetchSelectedMarkets, countSelectedMarkets } from "@/lib/supabase/selected-markets";
import { getQuotaLockState } from "@/lib/supabase/quota-cycles";
import {
  countConversations,
  countCoachMessagesThisWeek,
} from "@/lib/supabase/coach";
import { fetchNotifications } from "@/lib/supabase/notifications";
import {
  getDailyAnalysisLimit,
  getMaxTrackedWallets,
  getWeeklyCoachMessageLimit,
} from "@/lib/data/pricing";

export const metadata: Metadata = {
  title: "Tableau de bord — Polypips",
};

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
    selectedMarketsCount,
    walletQuota,
    conversationCount,
    coachMessagesThisWeek,
    notifications,
  ] = await Promise.all([
    countAnalysesToday(supabase, user.id),
    fetchSelectedMarkets(supabase, 5),
    countSelectedMarkets(supabase),
    getQuotaLockState(supabase, user.id, "wallets", maxTrackedWallets),
    countConversations(supabase),
    countCoachMessagesThisWeek(supabase),
    fetchNotifications(supabase, 5),
  ]);

  return (
    <>
      <Suspense fallback={null}>
        <CheckoutIntentRedirect />
      </Suspense>
      <DashboardOverviewFlow
        hasActiveSubscription={hasActiveAccess(subscription)}
        cancelled={isCancelledSubscription(subscription)}
        trialEndsAt={getTrialEndsAt(subscription)}
        analysesToday={analysesToday}
        dailyAnalysisLimit={getDailyAnalysisLimit(plan)}
        selectedMarketsCount={selectedMarketsCount}
        walletsFollowed={walletQuota.count}
        walletsMax={maxTrackedWallets}
        conversationCount={conversationCount}
        coachMessagesThisWeek={coachMessagesThisWeek}
        weeklyCoachLimit={getWeeklyCoachMessageLimit(plan)}
        recentMarkets={recentMarkets}
        notifications={notifications}
      />
    </>
  );
}
