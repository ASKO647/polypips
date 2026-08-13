import type { Metadata } from "next";
import { SettingsFlow } from "@/components/dashboard/settings/settings-flow";
import { createClient } from "@/lib/supabase/server";
import {
  fetchSubscription,
  getEffectivePlan,
  getTrialDaysRemaining,
} from "@/lib/supabase/subscriptions";
import { countAnalysesToday } from "@/lib/supabase/analyses";
import { getQuotaLockState } from "@/lib/supabase/quota-cycles";
import { getDailyAnalysisLimit, getMaxTrackedWallets, PRICING_PLANS } from "@/lib/data/pricing";

export const metadata: Metadata = {
  title: "Paramètres — Polypips",
};

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

  return (
    <SettingsFlow
      email={email}
      initialUsername={initialUsername}
      initialSubscription={subscription}
      plan={plan}
      analysesToday={analysesToday}
      dailyAnalysisLimit={getDailyAnalysisLimit(plan)}
      trialDaysRemaining={getTrialDaysRemaining(subscription)}
      walletQuotaCount={walletQuota.count}
      walletQuotaMax={maxTrackedWallets}
    />
  );
}
