import type { Metadata } from "next";
import { SmartMoneyFlow } from "@/components/dashboard/smart-money/smart-money-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription, getEffectivePlan, hasActiveAccess } from "@/lib/supabase/subscriptions";
import { fetchSmartMoneyData } from "@/lib/supabase/wallets";
import { getQuotaLockState } from "@/lib/supabase/quota-cycles";
import { getMaxTrackedWallets } from "@/lib/data/pricing";

export const metadata: Metadata = {
  title: "Smart Money — Polypips",
};

export default async function SmartMoneyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <SmartMoneyFlow
        wallets={[]}
        initialFollowedIds={[]}
        hasActiveSubscription={false}
        maxTrackedWallets={null}
        quotaLocked={false}
        quotaResetDate={null}
      />
    );
  }

  const [subscription, plan] = await Promise.all([
    fetchSubscription(supabase),
    getEffectivePlan(supabase, user.id),
  ]);
  const maxTrackedWallets = getMaxTrackedWallets(plan);

  // Syncing the quota cycle here (not just inside the API routes) is what
  // makes the monthly reset happen "on page load" per the chosen
  // mechanism — a stale-cycle selection gets wiped before wallets/follows
  // are even fetched below, so the page never shows a locked selection
  // from a cycle that has already rolled over.
  const lock = await getQuotaLockState(supabase, user.id, "wallets", maxTrackedWallets);

  const { wallets, followedWalletIds } = await fetchSmartMoneyData(supabase, user.id);

  return (
    <SmartMoneyFlow
      wallets={wallets}
      initialFollowedIds={Array.from(followedWalletIds)}
      hasActiveSubscription={hasActiveAccess(subscription)}
      maxTrackedWallets={maxTrackedWallets}
      quotaLocked={lock.locked}
      quotaResetDate={lock.periodEnd}
    />
  );
}
