"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Crown, Rocket } from "lucide-react";
import { getTrialDaysRemaining, type SubscriptionRow } from "@/lib/supabase/subscriptions";
import type { PricingPlan } from "@/lib/data/pricing";
import { formatResetDate } from "@/lib/utils";

const PLAN_ICONS: Record<string, typeof Crown> = {
  decouverte: Rocket,
  pro: Crown,
};

/** The 4th quick-access card — subscription status, not an activity
 * metric, so no sparkline (a flat line here would carry no real meaning).
 * Every line shown is derived from the real subscription row. */
export function SubscriptionQuickCard({
  subscription,
  plan,
}: {
  subscription: SubscriptionRow | null;
  plan: PricingPlan;
}) {
  const Icon = PLAN_ICONS[plan.id] ?? Crown;
  const trialDays = getTrialDaysRemaining(subscription);
  const cancelled =
    subscription !== null &&
    (subscription.cancelAtPeriodEnd || subscription.status === "canceled");
  const t = useTranslations("Dashboard.SubscriptionQuickCard");
  const locale = useLocale();

  let statusLine: string;
  if (!subscription) {
    statusLine = t("noneActive");
  } else if (trialDays !== null) {
    statusLine = t("expiresIn", { days: trialDays });
  } else if (cancelled) {
    statusLine = subscription.currentPeriodEnd
      ? t("endsOn", { date: formatResetDate(subscription.currentPeriodEnd, locale) })
      : t("cancelled");
  } else if (subscription.currentPeriodEnd) {
    statusLine = t("renewsOn", { date: formatResetDate(subscription.currentPeriodEnd, locale) });
  } else {
    statusLine = t("active");
  }

  return (
    <Link
      href="/dashboard/settings"
      prefetch
      className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-dash-border bg-dash-surface p-5 transition-colors duration-150 hover:border-dash-border-strong hover:bg-dash-surface-hover"
    >
      <Icon
        aria-hidden
        className="pointer-events-none absolute -right-3 -top-3 h-24 w-24 text-dash-surface-strong"
        strokeWidth={1.5}
      />
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="relative">
        <p className="text-xs font-semibold text-dash-text-quaternary">{t("statusLabel")}</p>
        <p className="mt-1 text-sm font-bold text-brand-400">{plan.name}</p>
        <p className="mt-0.5 text-xs text-dash-text-quaternary">{statusLine}</p>
      </div>
    </Link>
  );
}
