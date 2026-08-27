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
  fetchReferralSlug,
  fetchReferralStats,
  fetchReferralHistory,
} from "@/lib/supabase/user-referrals";
import { fetchTiktokSubmissions } from "@/lib/supabase/tiktok-clips";
import { requestOrigin } from "@/lib/owner-origin";

export const metadata: Metadata = {
  title: "Paramètres — Polypips",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  const email = user?.email ?? "";
  const initialUsername =
    (user?.user_metadata?.full_name as string | undefined) ?? "";

  if (!user) {
    const referralOrigin = await requestOrigin();
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
        referralOrigin={referralOrigin}
        initialReferralSlug={null}
        referralStats={{ totalReferred: 0, totalConverted: 0, pendingEur: 0, paidEur: 0 }}
        referralHistory={[]}
        tiktokSubmissions={[]}
      />
    );
  }

  const [subscription, plan, analysesToday, referralOrigin, referralSlug, referralStats, referralHistory, tiktokSubmissions] =
    await Promise.all([
      fetchSubscription(supabase),
      getEffectivePlan(supabase, user.id),
      countAnalysesToday(supabase, user.id),
      requestOrigin(),
      fetchReferralSlug(supabase, user.id),
      fetchReferralStats(supabase, user.id),
      fetchReferralHistory(supabase, user.id),
      fetchTiktokSubmissions(supabase, user.id),
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
      referralOrigin={referralOrigin}
      initialReferralSlug={referralSlug}
      referralStats={referralStats}
      referralHistory={referralHistory}
      tiktokSubmissions={tiktokSubmissions}
    />
  );
}
