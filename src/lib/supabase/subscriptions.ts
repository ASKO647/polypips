import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanId } from "@/lib/stripe/plans";
import { PRICING_PLANS, type PricingPlan } from "@/lib/data/pricing";

export type SubscriptionStatus = "trialing" | "active" | "canceled" | "past_due";

export type SubscriptionRow = {
  plan: PlanId;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

type RawRow = {
  plan: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

function mapRow(row: RawRow): SubscriptionRow {
  return {
    plan: row.plan as PlanId,
    status: row.status as SubscriptionStatus,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
  };
}

export async function fetchSubscription(
  supabase: SupabaseClient
): Promise<SubscriptionRow | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "plan, status, current_period_end, cancel_at_period_end, stripe_customer_id, stripe_subscription_id"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data as RawRow);
}

/** The one place "does this status grant access" is decided — everything
 * else in this file (and userHasActiveAccess below) defers to it so the
 * active/trialing rule can't drift between the different call shapes. */
function isActiveStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

/** Active or trialing both grant access — a cancellation only flips this
 * once Stripe actually ends the subscription at period end, so a user who
 * cancelled but is still inside their paid period stays "active" here. */
export function hasActiveAccess(subscription: SubscriptionRow | null): boolean {
  return subscription !== null && isActiveStatus(subscription.status);
}

/** Same check as hasActiveAccess(), but for server code (API routes,
 * mutating endpoints) that already has a userId and shouldn't pull the
 * full SubscriptionRow just to gate a request. This is the check every
 * mutating dashboard endpoint must call before doing anything that
 * consumes a real resource or exposes real data to a user with no active
 * subscription at all — UI blur alone is not a security boundary. */
export async function userHasActiveAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();
  return isActiveStatus(data?.status);
}

/** Same "no access → decouverte limits" fallback used by the coach-chat and
 * analyze-market Edge Functions, centralized here for Next.js API routes
 * that need to check a plan-derived limit server-side. */
export async function getEffectivePlan(
  supabase: SupabaseClient,
  userId: string
): Promise<PricingPlan> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .maybeSingle();

  const hasAccess = isActiveStatus(data?.status);
  const planId = hasAccess ? (data!.plan as PlanId) : "decouverte";
  return PRICING_PLANS.find((p) => p.id === planId) ?? PRICING_PLANS[0];
}

/** Days left in the discovery trial (current_period_end doubles as the
 * trial end date while status is "trialing" — see the Stripe webhook's
 * upsertSubscription). Returns null when the subscription isn't currently
 * trialing, or has no period end to compute from. */
export function getTrialDaysRemaining(
  subscription: SubscriptionRow | null
): number | null {
  if (subscription?.status !== "trialing" || !subscription.currentPeriodEnd) {
    return null;
  }
  const diffMs = new Date(subscription.currentPeriodEnd).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}
