import type { Metadata } from "next";
import { SmartMoneyFlow } from "@/components/dashboard/smart-money/smart-money-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription, getEffectivePlan, hasActiveAccess } from "@/lib/supabase/subscriptions";
import { fetchSmartMoneyData } from "@/lib/supabase/wallets";
import { getMaxTrackedWallets } from "@/lib/data/pricing";

export const metadata: Metadata = {
  title: "Smart Money — Polypips",
};

export default async function SmartMoneyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [subscription, { wallets, followedWalletIds }, plan] = await Promise.all([
    fetchSubscription(supabase),
    fetchSmartMoneyData(supabase, user?.id ?? null),
    user ? getEffectivePlan(supabase, user.id) : null,
  ]);

  return (
    <SmartMoneyFlow
      wallets={wallets}
      initialFollowedIds={Array.from(followedWalletIds)}
      hasActiveSubscription={hasActiveAccess(subscription)}
      maxTrackedWallets={plan ? getMaxTrackedWallets(plan) : null}
    />
  );
}
