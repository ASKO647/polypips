import type { Metadata } from "next";
import { CopyTradingFlow } from "@/components/dashboard/copy-trading/copy-trading-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription, getEffectivePlan, hasActiveAccess } from "@/lib/supabase/subscriptions";
import { fetchStrategies, fetchSuggestions } from "@/lib/supabase/copy-trading";
import { getMaxActiveCopyTradingStrategies } from "@/lib/data/pricing";
import type { Suggestion } from "@/lib/data/copy-trading";

export const metadata: Metadata = {
  title: "Copy Trading — Polypips",
};

export default async function CopyTradingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <CopyTradingFlow
        strategies={[]}
        suggestionsByStrategyId={{}}
        hasActiveSubscription={false}
        maxActiveStrategies={null}
      />
    );
  }

  const [subscription, strategies, plan] = await Promise.all([
    fetchSubscription(supabase),
    fetchStrategies(supabase, user.id),
    getEffectivePlan(supabase, user.id),
  ]);

  const strategyIds = strategies
    .map((s) => s.strategyId)
    .filter((id): id is string => id !== null);

  const suggestionsByStrategyId: Record<string, Suggestion[]> = {};
  await Promise.all(
    strategyIds.map(async (id) => {
      suggestionsByStrategyId[id] = await fetchSuggestions(supabase, id);
    })
  );

  return (
    <CopyTradingFlow
      strategies={strategies}
      suggestionsByStrategyId={suggestionsByStrategyId}
      hasActiveSubscription={hasActiveAccess(subscription)}
      maxActiveStrategies={getMaxActiveCopyTradingStrategies(plan)}
    />
  );
}
