import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SmartWalletFlow } from "@/components/dashboard/copy-trading/smart-wallet-flow";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import {
  fetchSubscription,
  hasActiveAccess,
  isCancelledSubscription,
} from "@/lib/supabase/subscriptions";
import { fetchSmartMoneyData } from "@/lib/supabase/wallets";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Polymarket.SmartWallet");
  return { title: t("metaTitle") };
}

export default async function SmartWalletPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    return (
      <SmartWalletFlow followedWallets={[]} hasActiveSubscription={false} cancelled={false} />
    );
  }

  const [subscription, { wallets, followedWalletIds }] = await Promise.all([
    fetchSubscription(supabase),
    fetchSmartMoneyData(supabase, user.id),
  ]);

  const followedWallets = wallets.filter((w) => followedWalletIds.has(w.id));

  return (
    <SmartWalletFlow
      followedWallets={followedWallets}
      hasActiveSubscription={hasActiveAccess(subscription)}
      cancelled={isCancelledSubscription(subscription)}
    />
  );
}
