"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Gauge,
  Infinity as InfinityIcon,
  Loader2,
  PauseCircle,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { getPricingPlans, type PricingPlan } from "@/lib/data/pricing";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";
import styles from "./subscription-tab.module.css";

type Props = {
  currentPlan: PricingPlan | null;
  subscription: SubscriptionRow | null;
  periodEndLabel: string | null;
  analysesToday: number;
  dailyAnalysisLimit: number | null;
  creditBalance: number;
  activity: { analysesCount: number; marketsFollowedCount: number; walletsFollowedCount: number };
  onOpenCancelModal: () => void;
};

export function SubscriptionTab({
  currentPlan,
  subscription,
  periodEndLabel,
  analysesToday,
  dailyAnalysisLimit,
  creditBalance,
  activity,
  onOpenCancelModal,
}: Props) {
  const locale = useLocale();
  const tPlans = useTranslations("Plans");
  const plans = getPricingPlans(tPlans).filter((item) => item.id !== "decouverte");
  const [plansOpen, setPlansOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<"annual" | "payment" | "invoice" | "pause" | null>(null);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  const choosePlan = async (plan: PricingPlan) => {
    if (pendingPlan || plan.id === subscription?.plan) return;
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
        window.location.assign(`/${locale}/dashboard/settings?checkout=success`);
        return;
      }
      if (!response.ok || !data.url) throw new Error(data.message || "Impossible de changer d’offre.");
      window.location.assign(data.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
      setPendingPlan(null);
    }
  };

  const planName = currentPlan?.name ?? (locale === "fr" ? "Aucune offre active" : "No active plan");
  const planPrice = currentPlan ? `${currentPlan.priceEur.toFixed(2).replace(".", ",")} €` : "—";
  const active = subscription?.status === "active" || subscription?.status === "trialing";
  const cancelled = subscription?.cancelAtPeriodEnd || subscription?.status === "canceled";
  const analysisPercent = dailyAnalysisLimit
    ? Math.min(100, Math.round((analysesToday / dailyAnalysisLimit) * 100))
    : 18;
  const quotas = [
    {
      label: locale === "fr" ? "Analyses aujourd’hui" : "Analyses today",
      value: dailyAnalysisLimit === null ? `${analysesToday}` : `${analysesToday} / ${dailyAnalysisLimit}`,
      percent: analysisPercent,
    },
    {
      label: locale === "fr" ? "Crédits d’analyse approfondie" : "Deep analysis credits",
      value: `${creditBalance}`,
      percent: Math.min(100, creditBalance * 5),
    },
    {
      label: locale === "fr" ? "Marchés analysés" : "Markets analyzed",
      value: `${activity.marketsFollowedCount}`,
      percent: Math.min(100, activity.marketsFollowedCount * 8),
    },
  ];

  const modalCopy = {
    annual: {
      title: locale === "fr" ? "Passer au paiement annuel" : "Switch to annual billing",
      body: locale === "fr"
        ? "La facturation annuelle n’est pas encore activée dans Stripe pour votre compte. Votre abonnement actuel ne sera pas modifié."
        : "Annual billing is not enabled in Stripe for your account yet. Your current subscription will not be changed.",
    },
    payment: {
      title: locale === "fr" ? "Moyen de paiement" : "Payment method",
      body: locale === "fr"
        ? "Le portail sécurisé de modification de carte n’est pas encore relié. Aucune donnée bancaire n’est demandée dans Polypips."
        : "The secure card-management portal is not connected yet. Polypips never asks for your card details here.",
    },
    invoice: {
      title: locale === "fr" ? "Télécharger une facture" : "Download an invoice",
      body: locale === "fr"
        ? "Aucune facture Stripe n’est disponible via l’interface actuelle. Le téléchargement sera proposé dès que le portail de facturation sera connecté."
        : "Stripe invoices are not available in the current interface. Downloads will be enabled once the billing portal is connected.",
    },
    pause: {
      title: locale === "fr" ? "Mettre l’abonnement en pause" : "Pause subscription",
      body: locale === "fr"
        ? "La pause temporaire n’est pas prise en charge par le backend actuel. Votre offre reste active et aucune modification n’a été effectuée."
        : "Temporary pauses are not supported by the current backend. Your plan remains active and no change was made.",
    },
  } as const;

  return (
    <section className={styles.root} aria-label={locale === "fr" ? "Gestion de l’abonnement" : "Subscription management"}>
      {toast && <div className={styles.toast}><CheckCircle2 />{toast}</div>}

      <div className={styles.planCard}>
        <div className={styles.planMain}>
          <div className={styles.planIcon}><Sparkles /></div>
          <div className={styles.planCopy}>
            <div className={styles.eyebrow}>{locale === "fr" ? "VOTRE OFFRE" : "YOUR PLAN"}</div>
            <div className={styles.planTitleRow}>
              <h2>{planName}</h2>
              <span className={cancelled ? styles.statusWarn : styles.statusActive}>
                <i />{cancelled ? (locale === "fr" ? "Résiliation programmée" : "Cancellation scheduled") : active ? (locale === "fr" ? "Actif" : "Active") : (locale === "fr" ? "Inactif" : "Inactive")}
              </span>
            </div>
            <div className={styles.price}><strong>{planPrice}</strong><span>{locale === "fr" ? "/ mois" : "/ month"}</span></div>
            <p><CalendarDays />{periodEndLabel ? `${locale === "fr" ? "Prochaine facturation le" : "Next billing on"} ${periodEndLabel}` : (locale === "fr" ? "Aucune prochaine facturation disponible" : "No upcoming billing date")}</p>
            <div className={styles.actions}>
              <button className={styles.primary} onClick={() => setPlansOpen(true)}>{locale === "fr" ? "Changer d’offre" : "Change plan"}<ArrowRight /></button>
              <button className={styles.secondary} onClick={() => setInfoModal("annual")}>{locale === "fr" ? "Passer à l’annuel" : "Switch to annual"}<span>-20 %</span></button>
            </div>
          </div>
        </div>

        <div className={styles.usage}>
          <div className={styles.usageHeading}><div><Gauge /><strong>{locale === "fr" ? "Votre consommation" : "Your usage"}</strong></div><span>{locale === "fr" ? "Cycle en cours" : "Current cycle"}</span></div>
          {quotas.map((quota, index) => <div className={styles.quota} key={quota.label} style={{ "--delay": `${index * 90}ms` } as React.CSSProperties}>
            <div><span>{quota.label}</span><strong>{dailyAnalysisLimit === null && index === 0 ? <><InfinityIcon /> {quota.value}</> : quota.value}</strong></div>
            <div className={styles.track}><i style={{ "--progress": `${quota.percent}%` } as React.CSSProperties} /></div>
          </div>)}
        </div>
      </div>

      <div className={styles.twoColumns}>
        <article className={styles.card}>
          <div className={styles.cardHeader}><span className={styles.smallIcon}><CreditCard /></span><div><h3>{locale === "fr" ? "Moyen de paiement" : "Payment method"}</h3><p>{locale === "fr" ? "Gérez la carte utilisée pour vos paiements." : "Manage the card used for payments."}</p></div></div>
          <div className={styles.paymentRow}><div className={styles.fakeCard}>VISA</div><div><strong>•••• •••• ••••</strong><span>{locale === "fr" ? "Données protégées par Stripe" : "Protected by Stripe"}</span></div><button onClick={() => setInfoModal("payment")}>{locale === "fr" ? "Modifier" : "Edit"}</button></div>
          <div className={styles.secure}><ShieldCheck />{locale === "fr" ? "Polypips ne stocke aucune donnée bancaire." : "Polypips stores no banking data."}</div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}><span className={styles.smallIcon}><ReceiptText /></span><div><h3>{locale === "fr" ? "Prochaine facture" : "Next invoice"}</h3><p>{periodEndLabel ?? (locale === "fr" ? "Date indisponible" : "Date unavailable")}</p></div></div>
          <div className={styles.invoiceAmount}><span>{planName}</span><strong>{planPrice}</strong></div>
          <div className={styles.invoiceLine}><span>{locale === "fr" ? "Sous-total mensuel" : "Monthly subtotal"}</span><b>{planPrice}</b></div>
          <div className={styles.invoiceTotal}><span>Total</span><strong>{planPrice}</strong></div>
        </article>
      </div>

      <article className={styles.card}>
        <div className={styles.sectionTitle}><div><FileText /><span><h3>{locale === "fr" ? "Historique de facturation" : "Billing history"}</h3><p>{locale === "fr" ? "Vos factures apparaîtront ici dès que le portail Stripe sera relié." : "Your invoices will appear here once the Stripe portal is connected."}</p></span></div></div>
        <div className={styles.table}>
          <div className={styles.tableHead}><span>Date</span><span>{locale === "fr" ? "Description" : "Description"}</span><span>{locale === "fr" ? "Montant" : "Amount"}</span><span>{locale === "fr" ? "Statut" : "Status"}</span><span>PDF</span></div>
          <div className={styles.emptyInvoice}><ReceiptText /><span>{locale === "fr" ? "Aucune facture accessible pour le moment" : "No invoice available yet"}</span><button onClick={() => setInfoModal("invoice")}><Download />{locale === "fr" ? "Vérifier les factures" : "Check invoices"}</button></div>
        </div>
      </article>

      <article className={`${styles.card} ${styles.manageCard}`}>
        <div><h3>{locale === "fr" ? "Gérer votre abonnement" : "Manage subscription"}</h3><p>{locale === "fr" ? "Vous pouvez suspendre temporairement ou résilier votre offre." : "You can temporarily pause or cancel your plan."}</p></div>
        <div><button onClick={() => setInfoModal("pause")}><PauseCircle />{locale === "fr" ? "Mettre en pause" : "Pause"}</button><button className={styles.danger} onClick={onOpenCancelModal}>{locale === "fr" ? "Résilier l’abonnement" : "Cancel subscription"}</button></div>
      </article>

      {plansOpen && <div className={styles.overlay} onMouseDown={(event) => event.target === event.currentTarget && setPlansOpen(false)}>
        <aside className={styles.drawer} aria-modal="true" role="dialog">
          <div className={styles.drawerHeader}><div><span>{locale === "fr" ? "ABONNEMENT" : "SUBSCRIPTION"}</span><h2>{locale === "fr" ? "Changer d’offre" : "Change plan"}</h2><p>{locale === "fr" ? "Choisissez l’offre adaptée à votre usage." : "Choose the plan that fits your needs."}</p></div><button aria-label={locale === "fr" ? "Fermer" : "Close"} onClick={() => setPlansOpen(false)}><X /></button></div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.planList}>{plans.map((item, index) => {
            const isCurrent = item.id === subscription?.plan;
            return <button key={item.id} className={`${styles.offer} ${isCurrent ? styles.offerCurrent : ""}`} onClick={() => choosePlan(item)} disabled={isCurrent || pendingPlan !== null} style={{ "--delay": `${index * 60}ms` } as React.CSSProperties}>
              <div><span>{item.name}</span>{isCurrent && <em><Check />{locale === "fr" ? "Offre actuelle" : "Current plan"}</em>}<p>{item.tagline}</p></div><strong>{item.priceEur.toFixed(2).replace(".", ",")} €<small>{locale === "fr" ? "/mois" : "/month"}</small></strong>{pendingPlan === item.id ? <Loader2 className={styles.spinner} /> : <ArrowRight />}
            </button>;
          })}</div>
        </aside>
      </div>}

      {infoModal && <div className={styles.overlay} onMouseDown={(event) => event.target === event.currentTarget && setInfoModal(null)}>
        <div className={styles.modal} role="dialog" aria-modal="true">
          <button className={styles.modalClose} onClick={() => setInfoModal(null)}><X /></button>
          <div className={styles.modalIcon}>{infoModal === "payment" ? <CreditCard /> : infoModal === "invoice" ? <ReceiptText /> : infoModal === "pause" ? <PauseCircle /> : <Sparkles />}</div>
          <h2>{modalCopy[infoModal].title}</h2><p>{modalCopy[infoModal].body}</p>
          <button className={styles.primary} onClick={() => { setInfoModal(null); showToast(locale === "fr" ? "Aucune modification effectuée" : "No changes made"); }}>{locale === "fr" ? "J’ai compris" : "Understood"}</button>
        </div>
      </div>}
    </section>
  );
}
