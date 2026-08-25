import type { Metadata } from "next";
import { SmartWalletsFlow } from "@/components/dashboard/smart-wallets/smart-wallets-flow";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import {
  fetchSubscription,
  hasActiveAccess,
  isCancelledSubscription,
} from "@/lib/supabase/subscriptions";
import { fetchSignalWallets, fetchUserFollowedSignalWalletIds } from "@/lib/supabase/signal-wallets";

export const metadata: Metadata = {
  title: "Smart Wallets — Polypips",
};

export default async function SmartWalletsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  const [wallets, subscription, followedIds] = await Promise.all([
    fetchSignalWallets(supabase),
    fetchSubscription(supabase),
    fetchUserFollowedSignalWalletIds(supabase, user?.id ?? null),
  ]);

  return (
    <SmartWalletsFlow
      wallets={wallets}
      initialFollowedIds={Array.from(followedIds)}
      hasActiveSubscription={hasActiveAccess(subscription)}
      cancelled={isCancelledSubscription(subscription)}
    />
  );
}
