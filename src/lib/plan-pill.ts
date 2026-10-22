import type { SubscriptionRow } from "@/lib/supabase/subscriptions";

export function daysRemainingFrom(trialEndsAt: string): number {
  const diffMs = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

export type PlanPillTranslator = (key: string, values?: Record<string, number>) => string;

/** Merges the old full-width TrialBanner's "expire dans X jours" copy into
 * this same pill instead of a separate CTA banner — there is no higher paid
 * tier to upsell to (single-tier pricing: discovery trial rolls straight
 * into Pro), so the count is purely informational now, never a button.
 * `t` must be scoped to the "Dashboard.Header.planPill" namespace. */
export function planPillLabel(
  t: PlanPillTranslator,
  subscription: SubscriptionRow | null,
  cancelled: boolean,
  trialDaysRemaining: number | null
): string {
  if (!subscription || cancelled) return t("none");
  if (subscription.status === "trialing") {
    if (trialDaysRemaining === null) return t("discovery");
    return trialDaysRemaining > 0
      ? t("discoveryDaysRemaining", { days: trialDaysRemaining })
      : t("discoveryLastDay");
  }
  if (subscription.status === "past_due") return t("pastDue");
  return t("pro");
}
