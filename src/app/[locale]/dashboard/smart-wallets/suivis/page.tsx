import type { Metadata } from "next";
import { SignalCopyTradingFlow } from "@/components/dashboard/smart-wallets/signal-copy-trading-flow";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import {
  fetchSubscription,
  hasActiveAccess,
  isCancelledSubscription,
} from "@/lib/supabase/subscriptions";
import { fetchSignalWallets, fetchUserFollowedSignalWalletIds } from "@/lib/supabase/signal-wallets";
import { fetchAllSignalCopySettings } from "@/lib/supabase/signal-copy-trading";

export const metadata: Metadata = {
  title: "Copy Trading — Fomo X Axiom — Polypips",
};

export default async function SignalCopyTradingPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    return (
      <SignalCopyTradingFlow
        allWallets={[]}
        initialFollowedIds={[]}
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

  return (
    <SignalCopyTradingFlow
      allWallets={allWallets}
      initialFollowedIds={Array.from(followedIds)}
      settingsByWalletId={settingsByWalletId}
      hasActiveSubscription={hasActiveAccess(subscription)}
      cancelled={isCancelledSubscription(subscription)}
    />
  );
}
