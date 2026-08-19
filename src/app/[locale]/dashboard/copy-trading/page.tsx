import type { Metadata } from "next";
import { CopyTradingFlow } from "@/components/dashboard/copy-trading/copy-trading-flow";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import {
  fetchSubscription,
  getEffectivePlan,
  hasActiveAccess,
  isCancelledSubscription,
} from "@/lib/supabase/subscriptions";
import { fetchStrategies, fetchSuggestions } from "@/lib/supabase/copy-trading";
import { getQuotaLockState } from "@/lib/supabase/quota-cycles";
import { getMaxActiveCopyTradingStrategies } from "@/lib/data/pricing";
import type { Suggestion } from "@/lib/data/copy-trading";

export const metadata: Metadata = {
  title: "Copy Trading — Polypips",
};

export default async function CopyTradingPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    return (
      <CopyTradingFlow
        strategies={[]}
        suggestionsByStrategyId={{}}
        hasActiveSubscription={false}
        cancelled={false}
        maxActiveStrategies={null}
        quotaLocked={false}
        quotaResetDate={null}
      />
    );
  }

  const [subscription, plan] = await Promise.all([
    fetchSubscription(supabase),
    getEffectivePlan(supabase, user.id),
  ]);
  const maxActiveStrategies = getMaxActiveCopyTradingStrategies(plan);

  // Same "reset on page load" mechanism as Smart Money — see that page's
  // comment. Must run before fetchStrategies so a rolled-over cycle's
  // wiped strategies are reflected immediately, not on the next load.
  const lock = await getQuotaLockState(supabase, user.id, "copy_trading", maxActiveStrategies);

  const strategies = await fetchStrategies(supabase, user.id);

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
      cancelled={isCancelledSubscription(subscription)}
      maxActiveStrategies={maxActiveStrategies}
      quotaLocked={lock.locked}
      quotaResetDate={lock.periodEnd}
    />
  );
}
