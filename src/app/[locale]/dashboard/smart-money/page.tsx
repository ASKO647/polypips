import type { Metadata } from "next";
import { SmartMoneyFlow } from "@/components/dashboard/smart-money/smart-money-flow";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import {
  fetchSubscription,
  getEffectivePlan,
  hasActiveAccess,
  isCancelledSubscription,
} from "@/lib/supabase/subscriptions";
import { fetchSmartMoneyData } from "@/lib/supabase/wallets";
import { getQuotaLockState } from "@/lib/supabase/quota-cycles";
import { getMaxTrackedWallets } from "@/lib/data/pricing";

export const metadata: Metadata = {
  title: "Smart Money — Polypips",
};

export default async function SmartMoneyPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    return (
      <SmartMoneyFlow
        wallets={[]}
        initialFollowedIds={[]}
        hasActiveSubscription={false}
        cancelled={false}
        maxTrackedWallets={null}
        quotaLocked={false}
        quotaResetDate={null}
        lastSyncedAt={null}
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

  // Most recent sync across the whole pool — sync-smart-money refreshes
  // every tracked wallet in the same run, so this is effectively "when did
  // the last run finish," used to seed the countdown to the next one.
  const lastSyncedAt = wallets.reduce<string | null>((latest, wallet) => {
    if (!wallet.lastSyncedAt) return latest;
    if (!latest || wallet.lastSyncedAt > latest) return wallet.lastSyncedAt;
    return latest;
  }, null);

  return (
    <SmartMoneyFlow
      wallets={wallets}
      initialFollowedIds={Array.from(followedWalletIds)}
      hasActiveSubscription={hasActiveAccess(subscription)}
      cancelled={isCancelledSubscription(subscription)}
      maxTrackedWallets={maxTrackedWallets}
      quotaLocked={lock.locked}
      quotaResetDate={lock.periodEnd}
      lastSyncedAt={lastSyncedAt}
    />
  );
}
