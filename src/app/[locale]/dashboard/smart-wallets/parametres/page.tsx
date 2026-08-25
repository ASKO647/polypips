import type { Metadata } from "next";
import { CopySettingsOverview } from "@/components/dashboard/smart-wallets/copy-settings-overview";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import {
  fetchSubscription,
  hasActiveAccess,
  isCancelledSubscription,
} from "@/lib/supabase/subscriptions";
import { fetchSignalWallets } from "@/lib/supabase/signal-wallets";
import { fetchAllSignalCopySettings } from "@/lib/supabase/signal-copy-trading";
import type { SignalWallet } from "@/lib/data/signal-wallets";
import type { SignalCopySettings } from "@/lib/data/signal-copy-trading";

export const metadata: Metadata = {
  title: "Paramètres Copy Trading — Polypips",
};

export default async function SignalCopySettingsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    return <CopySettingsOverview rows={[]} hasActiveSubscription={false} cancelled={false} />;
  }

  const [allWallets, subscription, settingsByWalletId] = await Promise.all([
    fetchSignalWallets(supabase),
    fetchSubscription(supabase),
    fetchAllSignalCopySettings(supabase, user.id),
  ]);

  const walletsById = new Map(allWallets.map((w) => [w.id, w]));
  const rows: { wallet: SignalWallet; settings: SignalCopySettings }[] = [];
  for (const [walletId, settings] of settingsByWalletId) {
    const wallet = walletsById.get(walletId);
    if (wallet) rows.push({ wallet, settings });
  }

  return (
    <CopySettingsOverview
      rows={rows}
      hasActiveSubscription={hasActiveAccess(subscription)}
      cancelled={isCancelledSubscription(subscription)}
    />
  );
}
