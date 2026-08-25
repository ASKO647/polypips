import type { Metadata } from "next";
import { PositionsFlow } from "@/components/dashboard/smart-wallets/positions-flow";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import {
  fetchSubscription,
  hasActiveAccess,
  isCancelledSubscription,
} from "@/lib/supabase/subscriptions";
import { fetchSignalCopyTrades } from "@/lib/supabase/signal-copy-trading";

export const metadata: Metadata = {
  title: "Trades copiés — Polypips",
};

export default async function SignalPositionsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  const [trades, subscription] = await Promise.all([
    user ? fetchSignalCopyTrades(supabase, user.id) : Promise.resolve([]),
    fetchSubscription(supabase),
  ]);

  return (
    <PositionsFlow
      trades={trades}
      hasActiveSubscription={hasActiveAccess(subscription)}
      cancelled={isCancelledSubscription(subscription)}
    />
  );
}
