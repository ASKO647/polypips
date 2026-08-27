import type { Metadata } from "next";
import { PipsTracksFlow } from "@/components/dashboard/pips-tracks/pips-tracks-flow";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { fetchSubscription, hasActiveAccess, isCancelledSubscription } from "@/lib/supabase/subscriptions";
import { fetchEvents, fetchSummary, fetchTopTokens } from "@/lib/supabase/pips-tracks";

export const metadata: Metadata = {
  title: "Pips Tracks — Fomo X Axiom — Polypips",
};

export default async function PipsTracksPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    return (
      <PipsTracksFlow
        initialEvents={[]}
        initialSummary={null}
        initialTopTokens={[]}
        followedWalletAddresses={[]}
        hasActiveSubscription={false}
        cancelled={false}
      />
    );
  }

  const [events, subscription, summary, topTokens, followsResult] = await Promise.all([
    fetchEvents(supabase),
    fetchSubscription(supabase),
    fetchSummary(supabase),
    fetchTopTokens(supabase),
    supabase
      .from("user_signal_wallet_follows")
      .select("signal_wallets(address)")
      .eq("user_id", user.id),
  ]);

  const followedWalletAddresses = (
    (followsResult.data ?? []) as unknown as { signal_wallets: { address: string }[] | null }[]
  )
    .flatMap((row) => row.signal_wallets ?? [])
    .map((wallet) => wallet.address)
    .filter((address): address is string => Boolean(address));

  return (
    <PipsTracksFlow
      initialEvents={events}
      initialSummary={summary}
      initialTopTokens={topTokens}
      followedWalletAddresses={followedWalletAddresses}
      hasActiveSubscription={hasActiveAccess(subscription)}
      cancelled={isCancelledSubscription(subscription)}
    />
  );
}
