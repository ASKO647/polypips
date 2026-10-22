"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getPricingPlans, type PricingPlan } from "@/lib/data/pricing";
import { hasActiveAccess, type SubscriptionRow } from "@/lib/supabase/subscriptions";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { fetchSubscription } from "@/lib/supabase/subscriptions";
import styles from "./subscription-plans.module.css";

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
  const [liveSubscription, setLiveSubscription] = useState(subscription);
  const hasAccess = hasActiveAccess(liveSubscription);
  const cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd ?? false;
  const currentPlanId = liveSubscription?.plan ?? null;
  const formatAmount = (amount: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(amount);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<PricingPlan | null>(null);
  const [compare, setCompare] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const modal = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (chosen || compare) modal.current?.showModal(); else modal.current?.close(); }, [chosen, compare]);

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
    (plan) => ["pro", "pro_plus", "ultimate"].includes(plan.id)
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
      if (data.changed) {
        // Plan change applied in place on the existing subscription
        // (proration handled by Stripe) — no Checkout redirect, just
        // reload so this page reflects the new plan.
        const started = Date.now();
        while (Date.now() - started < 60000) {
          const updated = await fetchSubscription(createClient());
          if (updated?.plan === plan.id && hasActiveAccess(updated)) {
            setLiveSubscription(updated); setChosen(null); setPendingPlan(null); setConfirmed(true); return;
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        throw new Error(locale === "fr" ? "La confirmation prend plus de temps. Actualisez pour vérifier votre offre." : "Confirmation is taking longer. Refresh to check your plan.");
        return;
      }
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
    <div className={`${styles.root} flex flex-col gap-6`}>
      {confirmed && <p role="status" className={styles.success}><Check />{locale === "fr" ? "Votre nouvelle offre est active" : "Your new plan is active"}</p>}
      {hasAccess && (
        <p className="rounded-xl border border-dash-border bg-dash-surface-alt px-4 py-3 text-sm text-dash-text-secondary">
          {cancelAtPeriodEnd
            ? t("cancelledNotice", { date: periodEndLabel ?? t("cancelledNoticeFallback") })
            : currentPlanId === "pro_legacy"
              ? t("legacyNotice")
              : t("activeNotice")}
        </p>
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className={`${styles.cards} grid gap-5`}>
        {visiblePlans.map((plan) => {
          const isCurrent = hasAccess && !cancelAtPeriodEnd && plan.id === currentPlanId;
          return (
            <div
              key={plan.id}
              className={cn(styles.card,
                "flex flex-col gap-4 rounded-2xl border p-6",
                plan.highlighted
                  ? "border-brand-400/50 bg-brand-500/[0.04]"
                  : "border-dash-border bg-dash-surface"
              )}
            >
              <div>
                {plan.highlighted && <span className={styles.badge}>{locale === "fr" ? "Le plus populaire" : "Most popular"}</span>}
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
                onClick={() => { setError(null); setChosen(plan); }}
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
      <div className={styles.assurances}>{locale === "fr" ? "Sans engagement · Changez d’offre à tout moment · Paiement sécurisé" : "No commitment · Change plans anytime · Secure payment"}</div>
      <button className={styles.compareButton} onClick={() => setCompare(true)}>{locale === "fr" ? "Comparer toutes les fonctionnalités →" : "Compare all features →"}</button>
      <dialog ref={modal} className={styles.modal} onCancel={event => { if (pendingPlan) event.preventDefault(); else { setChosen(null); setCompare(false); } }}>
        <button className={styles.close} aria-label="Fermer" disabled={pendingPlan !== null} onClick={() => { setChosen(null); setCompare(false); }}>×</button>
        {compare ? <><h2>{locale === "fr" ? "Comparaison des offres" : "Compare plans"}</h2><div className={styles.comparison}>{visiblePlans.map(plan => <article key={plan.id}><h3>{plan.name}</h3><b>{plan.price} {plan.priceSuffix}</b><ul>{plan.features.map(feature => <li key={feature}><Check />{feature}</li>)}</ul></article>)}</div></> : chosen && <><h2>{locale === "fr" ? "Récapitulatif de votre offre" : "Your plan summary"}</h2><h3>{chosen.name}</h3><strong>{chosen.price} {chosen.priceSuffix}</strong><ul>{chosen.features.slice(0,4).map(feature => <li key={feature}><Check />{feature}</li>)}</ul><dl><dt>{locale === "fr" ? "Montant débité aujourd’hui" : "Amount due today"}</dt><dd>{hasAccess ? (locale === "fr" ? "Prorata calculé par Stripe" : "Proration calculated by Stripe") : chosen.price}</dd><dt>{locale === "fr" ? "Prochain prélèvement" : "Next payment"}</dt><dd>{hasAccess && periodEndLabel ? periodEndLabel : (locale === "fr" ? "Un mois après l’activation, confirmé par Stripe" : "One month after activation, confirmed by Stripe")}</dd></dl><p>{locale === "fr" ? "Facturation mensuelle en euros. Les éventuels ajustements sont calculés par Stripe." : "Monthly billing in euros. Stripe calculates any adjustments."}</p>{error && <p role="alert">{error}</p>}<button className={styles.pay} disabled={pendingPlan !== null} onClick={() => handleChoose(chosen)}>{pendingPlan ? <><Loader2 />{locale === "fr" ? "Vérification…" : "Verifying…"}</> : (locale === "fr" ? "Confirmer et payer" : "Confirm and pay")}</button></>}
      </dialog>

      <Link
        href="/dashboard/settings"
        className="text-center text-sm font-semibold text-brand-400 transition-colors hover:text-brand-300"
      >
        {t("backToProfile")}
      </Link>
    </div>
  );
}
