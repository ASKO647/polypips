import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WalletDetailFlow } from "@/components/dashboard/smart-wallets/wallet-detail-flow";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import {
  fetchSubscription,
  hasActiveAccess,
  isCancelledSubscription,
} from "@/lib/supabase/subscriptions";
import {
  fetchSignalWalletById,
  fetchSignalWalletTrades,
  fetchUserFollowedSignalWalletIds,
} from "@/lib/supabase/signal-wallets";

export const metadata: Metadata = {
  title: "Smart Wallet — Polypips",
};

export default async function SmartWalletDetailPage({
  params,
}: {
  params: Promise<{ walletId: string }>;
}) {
  const { walletId } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();

  const wallet = await fetchSignalWalletById(supabase, walletId);
  if (!wallet) notFound();

  const [trades, subscription, followedIds] = await Promise.all([
    fetchSignalWalletTrades(supabase, walletId),
    fetchSubscription(supabase),
    fetchUserFollowedSignalWalletIds(supabase, user?.id ?? null),
  ]);

  return (
    <WalletDetailFlow
      wallet={wallet}
      trades={trades}
      isFollowed={followedIds.has(walletId)}
      hasActiveSubscription={hasActiveAccess(subscription)}
      cancelled={isCancelledSubscription(subscription)}
    />
  );
}
