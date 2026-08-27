import type { Metadata } from "next";
import { SettingsFlow } from "@/components/dashboard/settings/settings-flow";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import {
  fetchSubscription,
  getEffectivePlan,
  getTrialDaysRemaining,
} from "@/lib/supabase/subscriptions";
import { countAnalysesToday } from "@/lib/supabase/analyses";
import { getQuotaLockState } from "@/lib/supabase/quota-cycles";
import { getDailyAnalysisLimit, getMaxTrackedWallets, PRICING_PLANS } from "@/lib/data/pricing";
import {
  fetchProfileActivityStats,
  EMPTY_PROFILE_ACTIVITY_STATS,
} from "@/lib/supabase/profile-activity";

export const metadata: Metadata = {
  title: "Paramètres — Polypips",
};

const MEMBER_SINCE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function SettingsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  const email = user?.email ?? "";
  const initialUsername =
    (user?.user_metadata?.full_name as string | undefined) ?? "";
  const initialPseudo = (user?.user_metadata?.username as string | undefined) ?? "";
  const initialAvatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  if (!user) {
    return (
      <SettingsFlow
        email={email}
        initialUsername={initialUsername}
        initialPseudo={initialPseudo}
        initialAvatarUrl={initialAvatarUrl}
        memberSince={null}
        googleConnected={false}
        mfaEnabled={false}
        activity={EMPTY_PROFILE_ACTIVITY_STATS}
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

  const [subscription, plan, analysesToday, activity, mfaFactors] = await Promise.all([
    fetchSubscription(supabase),
    getEffectivePlan(supabase, user.id),
    countAnalysesToday(supabase, user.id),
    fetchProfileActivityStats(supabase, user.id),
    supabase.auth.mfa.listFactors(),
  ]);

  const maxTrackedWallets = getMaxTrackedWallets(plan);
  const walletQuota = await getQuotaLockState(
    supabase,
    user.id,
    "wallets",
    maxTrackedWallets
  );

  const memberSince = user.created_at
    ? MEMBER_SINCE_FORMATTER.format(new Date(user.created_at))
    : null;
  const googleConnected = (user.app_metadata?.providers as string[] | undefined)?.includes(
    "google"
  ) ?? false;
  const mfaEnabled = (mfaFactors.data?.totp?.length ?? 0) > 0;

  return (
    <SettingsFlow
      email={email}
      initialUsername={initialUsername}
      initialPseudo={initialPseudo}
      initialAvatarUrl={initialAvatarUrl}
      memberSince={memberSince}
      googleConnected={googleConnected}
      mfaEnabled={mfaEnabled}
      activity={activity}
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
