import type { Metadata } from "next";
import { SettingsFlow } from "@/components/dashboard/settings/settings-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription, getEffectivePlan } from "@/lib/supabase/subscriptions";
import { countAnalysesToday } from "@/lib/supabase/analyses";
import { getQuotaLockState } from "@/lib/supabase/quota-cycles";
import { getDailyAnalysisLimit, getMaxTrackedWallets, PRICING_PLANS } from "@/lib/data/pricing";

export const metadata: Metadata = {
  title: "Paramètres — Polypips",
};

function computeTrialDaysRemaining(periodEndIso: string): number {
  const diffMs = new Date(periodEndIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "";
  const initialUsername =
    (user?.user_metadata?.full_name as string | undefined) ?? "";

  if (!user) {
    return (
      <SettingsFlow
        email={email}
        initialUsername={initialUsername}
        initialSubscription={null}
        plan={PRICING_PLANS[0]}
        analysesToday={0}
        dailyAnalysisLimit={null}
        trialDaysRemaining={null}
        walletQuotaCount={0}
        walletQuotaMax={null}
      />
    );
  }

  const [subscription, plan, analysesToday] = await Promise.all([
    fetchSubscription(supabase),
    getEffectivePlan(supabase, user.id),
    countAnalysesToday(supabase, user.id),
  ]);

  const maxTrackedWallets = getMaxTrackedWallets(plan);
  const walletQuota = await getQuotaLockState(
    supabase,
    user.id,
    "wallets",
    maxTrackedWallets
  );

  const trialDaysRemaining =
    subscription?.status === "trialing" && subscription.currentPeriodEnd
      ? computeTrialDaysRemaining(subscription.currentPeriodEnd)
      : null;

  return (
    <SettingsFlow
      email={email}
      initialUsername={initialUsername}
      initialSubscription={subscription}
      plan={plan}
      analysesToday={analysesToday}
      dailyAnalysisLimit={getDailyAnalysisLimit(plan)}
      trialDaysRemaining={trialDaysRemaining}
      walletQuotaCount={walletQuota.count}
      walletQuotaMax={maxTrackedWallets}
    />
  );
}

