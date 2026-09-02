"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCurrency } from "@/providers/currency-provider";
import { getPricingPlans, type PricingPlan } from "@/lib/data/pricing";
import { hasActiveAccess, type SubscriptionRow } from "@/lib/supabase/subscriptions";
import { cn } from "@/lib/utils";

/**
 * The dashboard's own "mini pricing page" (point 9) — distinct from the
 * marketing site's /pricing, which sells to logged-out visitors and links
 * back to /signup. This one assumes an authenticated user already inside
 * the app, hits /api/stripe/checkout directly, and reflects their real
 * current subscription state instead of a generic sales pitch.
 */
export function SubscriptionPlans({
  subscription,
  periodEndLabel,
}: {
  subscription: SubscriptionRow | null;
  /** Formatted "12 mars 2024", or null if unavailable. */
  periodEndLabel: string | null;
}) {
  const locale = useLocale();
  const t = useTranslations("SubscriptionPlans");
  const tPlans = useTranslations("Plans");
  const hasAccess = hasActiveAccess(subscription);
  const cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd ?? false;
  const currentPlanId = subscription?.plan ?? null;
  const { formatAmount } = useCurrency();
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The discovery offer is one-shot: `subscription !== null` means this user
  // has already had a subscription at some point (rows are never deleted,
  // only marked "canceled" — see /api/stripe/checkout and
  // /api/stripe/webhook). Hide the card so nobody sees a 0,99 € price they'd
  // actually be charged 29,99 € for — except while they're still mid-way
  // through an active discovery trial, where it correctly reads as their
  // current plan rather than a new purchase.
  const isCurrentlyOnDiscoveryTrial = hasAccess && currentPlanId === "decouverte";
  const hasSubscribedBefore = subscription !== null;
  const visiblePlans = getPricingPlans(tPlans).filter(
    (plan) => plan.id !== "decouverte" || !hasSubscribedBefore || isCurrentlyOnDiscoveryTrial
  );

  const handleChoose = async (plan: PricingPlan) => {
    if (pendingPlan) return;
    setPendingPlan(plan.id);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id, locale }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.message || t("checkoutError"));
      }
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
      setPendingPlan(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {hasAccess && (
        <p className="rounded-xl border border-dash-border bg-dash-surface-alt px-4 py-3 text-sm text-dash-text-secondary">
          {cancelAtPeriodEnd
            ? t("cancelledNotice", { date: periodEndLabel ?? t("cancelledNoticeFallback") })
            : t("activeNotice")}
        </p>
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="grid gap-5 sm:grid-cols-2">
        {visiblePlans.map((plan) => {
          const isCurrent = hasAccess && !cancelAtPeriodEnd && plan.id === currentPlanId;
          return (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col gap-4 rounded-2xl border p-6",
                plan.highlighted
                  ? "border-brand-400/50 bg-brand-500/[0.04]"
                  : "border-dash-border bg-dash-surface"
              )}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-dash-text">{plan.name}</h2>
                  {isCurrent && (
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                      {t("currentPlan")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-dash-text-tertiary">{plan.tagline}</p>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-bold text-dash-text">
                  {formatAmount(plan.priceEur)}
                </span>
                <span className="text-sm text-dash-text-tertiary">{plan.priceSuffix}</span>
              </div>
              {plan.afterOffer && (
                <p className="-mt-2.5 text-xs text-dash-text-quaternary">{plan.afterOffer}</p>
              )}

              <ul className="flex flex-col gap-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-dash-text-secondary">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2.5} />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleChoose(plan)}
                disabled={isCurrent || pendingPlan !== null}
                className={cn(
                  "mt-auto flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60",
                  plan.highlighted
                    ? "bg-brand-500 text-white hover:bg-brand-600"
                    : "border border-dash-border-strong text-dash-text hover:border-dash-text-quaternary"
                )}
              >
                {pendingPlan === plan.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCurrent ? (
                  t("currentPlan")
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          );
        })}
      </div>

      <Link
        href="/dashboard/settings"
        className="text-center text-sm font-semibold text-brand-400 transition-colors hover:text-brand-300"
      >
        {t("backToProfile")}
      </Link>
    </div>
  );
}
