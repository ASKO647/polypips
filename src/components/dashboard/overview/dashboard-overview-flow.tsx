"use client";

import { useState } from "react";
import { GraduationCap, Sparkles, Wallet } from "lucide-react";
import { AnalysisResult } from "@/components/dashboard/analyse-ia/analysis-result";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { TrialBanner } from "@/components/dashboard/overview/trial-banner";
import { QuickAccessCard } from "@/components/dashboard/overview/quick-access-card";
import { SubscriptionQuickCard } from "@/components/dashboard/overview/subscription-quick-card";
import { MarketsTable } from "@/components/dashboard/overview/markets-table";
import { RecentActivitySection } from "@/components/dashboard/overview/recent-activity-section";
import {
  ActivityDonut,
  type ActivityPeriodCounts,
  type ActivityPeriodKey,
} from "@/components/dashboard/overview/activity-donut";
import { UpgradeToProCard } from "@/components/dashboard/overview/upgrade-to-pro-card";
import { PerformanceCard } from "@/components/dashboard/overview/performance-card";
import type { MarketAnalysis } from "@/lib/data/analysis";
import type { NotificationItem } from "@/lib/data/notifications";
import type { PricingPlan } from "@/lib/data/pricing";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";

export function DashboardOverviewFlow({
  firstName,
  hasActiveSubscription,
  cancelled,
  trialEndsAt,
  subscription,
  plan,
  analysesToday,
  dailyAnalysisLimit,
  walletsFollowed,
  walletsMax,
  conversationCount,
  recentMarkets,
  notifications,
  analysesSparkline,
  smartMoneySparkline,
  coachSparkline,
  activityPeriods,
}: {
  /** Real first name from user_metadata (Google OAuth only) — null for
   * plain email/password accounts, which never collect a name. */
  firstName: string | null;
  hasActiveSubscription: boolean;
  /** True when access is blocked because the user cancelled — swaps the
   * "Débutez pour 0,99 €" first-time CTA for a "réabonnez-vous" one. */
  cancelled: boolean;
  /** ISO end-of-trial date, only while genuinely still trialing (not
   * cancelled) — TrialBanner recomputes the days-remaining count itself
   * client-side so it keeps ticking down without a page reload. */
  trialEndsAt: string | null;
  subscription: SubscriptionRow | null;
  plan: PricingPlan;
  analysesToday: number;
  dailyAnalysisLimit: number | null;
  walletsFollowed: number;
  walletsMax: number | null;
  conversationCount: number;
  recentMarkets: MarketAnalysis[];
  notifications: NotificationItem[];
  /** Real daily counts (oldest→newest, 7 days) for each quick-access
   * card's sparkline — all-zero when there's no real activity. */
  analysesSparkline: number[];
  smartMoneySparkline: number[];
  coachSparkline: number[];
  activityPeriods: Record<ActivityPeriodKey, ActivityPeriodCounts>;
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

  const isPro =
    hasActiveSubscription && subscription?.plan === "pro" && !cancelled;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {firstName ? `Bonjour, ${firstName} 👋` : "Bonjour 👋"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
            Vue d&apos;ensemble de votre activité et de vos accès rapides.
          </p>
        </div>

        {trialEndsAt !== null && !cancelled && (
          <div className="lg:max-w-xl lg:flex-1">
            <TrialBanner trialEndsAt={trialEndsAt} />
          </div>
        )}
      </div>

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
            sparklinePoints={analysesSparkline}
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
            tone="emerald"
            sparklinePoints={smartMoneySparkline}
          />
          <QuickAccessCard
            href="/dashboard/coach"
            icon={GraduationCap}
            title="Coach IA"
            stat={`${conversationCount} conversation${conversationCount > 1 ? "s" : ""}`}
            tone="amber"
            sparklinePoints={coachSparkline}
          />
          <SubscriptionQuickCard subscription={subscription} plan={plan} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
          <div className="lg:col-span-2">
            <MarketsTable markets={recentMarkets} onSelect={setSelectedMarket} />
          </div>
          <div className="flex flex-col gap-4">
            <ActivityDonut periods={activityPeriods} />
            {!isPro && <UpgradeToProCard />}
            <PerformanceCard />
          </div>
        </div>
      </LockedOverlay>

      {/* Deliberately outside LockedOverlay — notifications stay visible
       * even without an active subscription (see the "Fix subscription
       * gating gaps" audit, which gated everything else here but left this
       * alone). lg:items-start above keeps the locked grid's left column
       * from stretching to the taller right column, so this sits flush
       * under MarketsTable instead of leaving a gap. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivitySection notifications={notifications} />
        </div>
      </div>
    </div>
  );
}
