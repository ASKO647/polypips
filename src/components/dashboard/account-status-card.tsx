"use client";

import { Crown, Rocket } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCurrency } from "@/providers/currency-provider";
import { getPricingPlans } from "@/lib/data/pricing";
import { getTrialDaysRemaining, type SubscriptionRow } from "@/lib/supabase/subscriptions";
import { formatResetDate } from "@/lib/utils";

export const PLAN_ICONS: Record<string, typeof Crown> = {
  decouverte: Rocket,
  pro: Crown,
};

/** Sidebar account card. While genuinely trialing, this is the countdown
 * card the user sees everywhere else in the product (see the header's plan
 * pill) — real days-remaining from Stripe's current_period_end, never a
 * static placeholder. Once the trial rolls into Pro (or is cancelled/past
 * due), it collapses to a plain status line instead — there's no higher
 * tier left to sell and no countdown left to show. */
export function AccountStatusCard({
  subscription,
}: {
  subscription: SubscriptionRow | null;
}) {
  const { formatAmount } = useCurrency();
  const tPlans = useTranslations("Plans");
  const t = useTranslations("Dashboard.AccountStatusCard");
  const plans = getPricingPlans(tPlans);
  const DECOUVERTE_PLAN = plans.find((p) => p.id === "decouverte") ?? plans[0];
  const PRO_PLAN = plans.find((p) => p.id === "pro") ?? plans[0];

  if (!subscription) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-dash-border bg-dash-surface-strong p-4">
        <p className="text-sm font-semibold text-dash-text">{t("noSubscription")}</p>
        <p className="text-xs text-dash-text-tertiary">{t("unlockDescription")}</p>
        <Link
          href="/pricing"
          className="flex h-9 w-full items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
        >
          {t("viewOffers")}
        </Link>
      </div>
    );
  }

  const trialDays = getTrialDaysRemaining(subscription);

  if (subscription.status === "trialing" && trialDays !== null) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-dash-border bg-dash-surface-strong p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
            <Rocket className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="text-sm font-semibold text-dash-text">{t("discoveryOffer")}</span>
        </div>

        <div>
          <p className="text-xs text-dash-text-tertiary">{t("expiresIn")}</p>
          <p className="mt-1 font-display text-3xl font-bold text-brand-400">
            {t("daysCount", { days: trialDays })}
          </p>
        </div>

        <p className="text-xs text-dash-text-secondary">{t("fullAccess")}</p>

        <p className="text-[11px] text-dash-text-quaternary">
          {t("thenPrice", { price: formatAmount(PRO_PLAN.priceEur), suffix: PRO_PLAN.priceSuffix })}
        </p>
      </div>
    );
  }

  const cancelled = subscription.cancelAtPeriodEnd || subscription.status === "canceled";
  const pastDue = subscription.status === "past_due";
  const plan = subscription.plan === "pro" ? PRO_PLAN : DECOUVERTE_PLAN;
  const PlanIcon = PLAN_ICONS[plan.id] ?? Crown;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dash-border bg-dash-surface-strong p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
          <PlanIcon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="truncate text-sm font-semibold text-dash-text">{plan.name}</span>
      </div>

      {pastDue ? (
        <p className="text-xs font-semibold text-amber-400">{t("pastDue")}</p>
      ) : cancelled ? (
        <p className="text-xs font-semibold text-dash-text-secondary">
          {subscription.currentPeriodEnd
            ? t("endsOn", { date: formatResetDate(subscription.currentPeriodEnd) })
            : t("cancelled")}
        </p>
      ) : (
        <p className="text-xs text-dash-text-tertiary">
          {subscription.currentPeriodEnd
            ? t("renewsOn", { date: formatResetDate(subscription.currentPeriodEnd) })
            : t("active")}
        </p>
      )}
    </div>
  );
}
