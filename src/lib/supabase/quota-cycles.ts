import type { SupabaseClient } from "@supabase/supabase-js";
import { countFollowedWallets } from "@/lib/supabase/wallets";

export type QuotaFeature = "wallets";

/**
 * Ensures the user's quota-cycle anchor for `feature` matches their
 * subscription's live current_period_end, resetting their followed-wallet
 * selection if the subscription has actually renewed since the anchor was
 * last set.
 *
 * Returns the live period_end to lock against, or null when the user has
 * no real Stripe subscription period to anchor to — callers should treat
 * null as "skip the lock entirely," since there's no genuine renewal date
 * to enforce or display (see the migration comment for why).
 */
export async function syncQuotaCycle(
  supabase: SupabaseClient,
  userId: string,
  feature: QuotaFeature
): Promise<{ periodEnd: string | null; resetOccurred: boolean }> {
  const { data: subscriptionRow } = await supabase
    .from("subscriptions")
    .select("current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  const periodEnd = subscriptionRow?.current_period_end as string | null | undefined;
  if (!periodEnd) return { periodEnd: null, resetOccurred: false };

  const { data: cycleRow } = await supabase
    .from("user_quota_cycles")
    .select("period_end")
    .eq("user_id", userId)
    .eq("feature", feature)
    .maybeSingle();

  const sameCycle =
    cycleRow && new Date(cycleRow.period_end as string).getTime() === new Date(periodEnd).getTime();
  if (sameCycle) return { periodEnd, resetOccurred: false };

  // No anchor yet, or the subscription has renewed since it was set — wipe
  // this feature's selection and re-anchor to the current cycle.
  await supabase.from("user_wallet_follows").delete().eq("user_id", userId);

  await supabase.from("user_quota_cycles").upsert(
    { user_id: userId, feature, period_end: periodEnd, updated_at: new Date().toISOString() },
    { onConflict: "user_id,feature" }
  );

  return { periodEnd, resetOccurred: true };
}

export type QuotaLockState = {
  /** True once the user has reached maxAllowed for the current cycle —
   * both growing AND shrinking the selection are blocked until reset. */
  locked: boolean;
  count: number;
  maxAllowed: number | null;
  /** The subscription's live renewal date, when the lock applies — null
   * for an unlimited plan or a user with no real billing cycle. */
  periodEnd: string | null;
};

/**
 * Syncs the quota cycle (resetting on rollover) and reports whether the
 * user is currently locked at their plan's limit for `feature`.
 * maxAllowed === null (both plans are unlimited on this quota now, or
 * there's no billing cycle to anchor to) always means unlocked.
 */
export async function getQuotaLockState(
  supabase: SupabaseClient,
  userId: string,
  feature: QuotaFeature,
  maxAllowed: number | null
): Promise<QuotaLockState> {
  if (maxAllowed === null) {
    return { locked: false, count: 0, maxAllowed: null, periodEnd: null };
  }

  const { periodEnd } = await syncQuotaCycle(supabase, userId, feature);
  if (periodEnd === null) {
    return { locked: false, count: 0, maxAllowed, periodEnd: null };
  }

  const count = await countFollowedWallets(supabase, userId);

  return { locked: count >= maxAllowed, count, maxAllowed, periodEnd };
}
