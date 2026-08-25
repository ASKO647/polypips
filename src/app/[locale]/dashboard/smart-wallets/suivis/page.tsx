import type { Metadata } from "next";
import { MySmartWalletsFlow } from "@/components/dashboard/smart-wallets/my-smart-wallets-flow";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import {
  fetchSubscription,
  hasActiveAccess,
  isCancelledSubscription,
} from "@/lib/supabase/subscriptions";
import { fetchSignalWallets, fetchUserFollowedSignalWalletIds } from "@/lib/supabase/signal-wallets";
import { fetchAllSignalCopySettings } from "@/lib/supabase/signal-copy-trading";

export const metadata: Metadata = {
  title: "Mes Smart Wallets — Polypips",
};

export default async function MySmartWalletsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    return (
      <MySmartWalletsFlow
        wallets={[]}
        settingsByWalletId={new Map()}
        hasActiveSubscription={false}
        cancelled={false}
      />
    );
  }

  const [allWallets, subscription, followedIds, settingsByWalletId] = await Promise.all([
    fetchSignalWallets(supabase),
    fetchSubscription(supabase),
    fetchUserFollowedSignalWalletIds(supabase, user.id),
    fetchAllSignalCopySettings(supabase, user.id),
  ]);

  const followedWallets = allWallets.filter((w) => followedIds.has(w.id));

  return (
    <MySmartWalletsFlow
      wallets={followedWallets}
      settingsByWalletId={settingsByWalletId}
      hasActiveSubscription={hasActiveAccess(subscription)}
      cancelled={isCancelledSubscription(subscription)}
    />
  );
}
