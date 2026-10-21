"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Bell, CheckCircle2, CreditCard, Link2, Lock, Save, Settings, UserRound } from "lucide-react";
import { ProfileOverviewTab as ProfileTab } from "@/components/dashboard/settings/profile-overview-tab";
import { SubscriptionTab } from "@/components/dashboard/settings/subscription-tab";
import { SecurityTab } from "@/components/dashboard/settings/security-tab";
import { NotificationsTab } from "@/components/dashboard/settings/notifications-tab";
import { PreferencesTab } from "@/components/dashboard/settings/preferences-tab";
import { CancelSubscriptionModal } from "@/components/dashboard/settings/cancel-subscription-modal";
import { DeleteAccountModal } from "@/components/dashboard/settings/delete-account-modal";
import { getPricingPlans, type PricingPlan } from "@/lib/data/pricing";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";
import type { ProfileActivityStats } from "@/lib/supabase/profile-activity";
import { DashboardChrome } from "@/components/dashboard/shared/dashboard-chrome";
import styles from "./profile-page.module.css";

export function SettingsFlow({
  email,
  initialUsername,
  initialPseudo,
  initialAvatarUrl,
  memberSince,
  googleConnected,
  mfaEnabled,
  activity,
  initialSubscription,
  plan,
  analysesToday,
  dailyAnalysisLimit,
  trialDaysRemaining,
  creditBalance,
  referralSlug,
}: {
  email: string;
  initialUsername: string;
  initialPseudo: string;
  initialAvatarUrl: string | null;
  /** Formatted "12 mars 2024", or null if unavailable. */
  memberSince: string | null;
  googleConnected: boolean;
  mfaEnabled: boolean;
  activity: ProfileActivityStats;
  initialSubscription: SubscriptionRow | null;
  plan: PricingPlan;
  analysesToday: number;
  dailyAnalysisLimit: number | null;
  /** Days left in the discovery trial, or null when not currently trialing. */
  trialDaysRemaining: number | null;
  creditBalance: number;
  referralSlug: string | null;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Profile.SettingsFlow");
  const tPlans = useTranslations("Plans");
  const [subscription, setSubscription] = useState(initialSubscription);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const isSubscriptionTab = activeTab === "subscription";
  const isSecurityTab = activeTab === "security";
  const isNotificationsTab = activeTab === "notifications";
  const isPreferencesTab = activeTab === "preferences";

  const handleConfirmCancel = async () => {
    setCancelling(true);
    setActionError(null);
    try {
      const response = await fetch("/api/stripe/cancel", { method: "POST" });
      if (!response.ok) throw new Error(t("cancelError"));
      setSubscription((prev) => (prev ? { ...prev, cancelAtPeriodEnd: true } : prev));
      setCancelModalOpen(false);
      setTimeout(() => router.refresh(), 1500);
    } catch {
      setActionError(t("cancelError"));
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmDelete = () => {
    console.log("Demande de suppression de compte déclenchée (mock, non branchée à Supabase).");
    setDeletionRequested(true);
    setDeleteModalOpen(false);
  };

  const currentPlan = subscription
    ? (getPricingPlans(tPlans).find((p) => p.id === subscription.plan) ?? null)
    : null;
  const periodEndLabel = subscription?.currentPeriodEnd
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(
        new Date(subscription.currentPeriodEnd),
      )
    : null;

  const tabs = [
    ["profile", locale === "fr" ? "Profil" : "Profile", UserRound],
    ["subscription", locale === "fr" ? "Abonnement" : "Subscription", CreditCard],
    ["security", locale === "fr" ? "Sécurité" : "Security", Lock],
    ["notifications", "Notifications", Bell],
    ["preferences", locale === "fr" ? "Préférences" : "Preferences", Settings],
    ["connections", locale === "fr" ? "Connexions" : "Connections", Link2],
  ] as const;

  return (
    <DashboardChrome hideHeader title={isPreferencesTab ? (locale === "fr" ? "Préférences" : "Preferences") : isNotificationsTab ? "Notifications" : isSecurityTab ? (locale === "fr" ? "Sécurité" : "Security") : isSubscriptionTab ? (locale === "fr" ? "Abonnement" : "Subscription") : (locale === "fr" ? "Profil" : "Profile")} firstName={initialUsername}>
    <main className={styles.page}>
      <header className={styles.pageHeader}><div><span>Polypips&nbsp;&nbsp;/&nbsp;&nbsp;{locale === "fr" ? "Profil" : "Profile"}{(isSubscriptionTab || isSecurityTab || isNotificationsTab || isPreferencesTab) && <>&nbsp;&nbsp;/&nbsp;&nbsp;{isPreferencesTab ? (locale === "fr" ? "Préférences" : "Preferences") : isNotificationsTab ? "Notifications" : isSecurityTab ? (locale === "fr" ? "Sécurité" : "Security") : (locale === "fr" ? "Abonnement" : "Subscription")}</>}</span><h1>{isPreferencesTab ? (locale === "fr" ? "Préférences" : "Preferences") : isNotificationsTab ? "Notifications" : isSecurityTab ? (locale === "fr" ? "Sécurité du compte" : "Account security") : isSubscriptionTab ? (locale === "fr" ? "Mon abonnement" : "My subscription") : (locale === "fr" ? "Mon profil" : "My profile")}</h1><p>{isPreferencesTab ? (locale === "fr" ? "Personnalisez l’affichage, les analyses et votre expérience Polypips." : "Customize display, analysis and your Polypips experience.") : isNotificationsTab ? (locale === "fr" ? "Choisissez les alertes que vous souhaitez recevoir et à quel moment." : "Choose which alerts you receive and when.") : isSecurityTab ? (locale === "fr" ? "Protégez votre compte et contrôlez vos connexions." : "Protect your account and control your sign-ins.") : isSubscriptionTab ? (locale === "fr" ? "Gérez votre offre, votre consommation et votre facturation." : "Manage your plan, usage and billing.") : (locale === "fr" ? "Gérez votre identité, votre abonnement et vos préférences." : "Manage your identity, subscription and preferences.")}</p></div><div className={styles.headerActions}>{!isPreferencesTab && <span><CheckCircle2 />{isNotificationsTab ? (locale === "fr" ? "Alertes configurées" : "Alerts configured") : isSecurityTab ? (locale === "fr" ? "Compte protégé" : "Protected account") : isSubscriptionTab ? (subscription && !subscription.cancelAtPeriodEnd ? (locale === "fr" ? "Abonnement actif" : "Active subscription") : (locale === "fr" ? "État du compte" : "Account status")) : (locale === "fr" ? "Compte vérifié" : "Verified account")}</span>}{!isSubscriptionTab && !isSecurityTab && <button onClick={() => document.getElementById(isPreferencesTab ? "preferences-save-action" : isNotificationsTab ? "notifications-save-action" : "profile-save-action")?.click()}><Save />{(isPreferencesTab || isNotificationsTab) ? (locale === "fr" ? "Enregistrer les préférences" : "Save preferences") : (locale === "fr" ? "Enregistrer les modifications" : "Save changes")}</button>}</div></header>
      <nav className={styles.tabs} aria-label={locale === "fr" ? "Rubriques du profil" : "Profile sections"}>{tabs.map(([id,label,Icon]) => <button key={id} className={activeTab === id ? styles.tabActive : ""} onClick={() => setActiveTab(id)}><Icon />{label}</button>)}</nav>
      <div className={styles.profileContent} key={activeTab} data-section={activeTab}>
      {isPreferencesTab ? <PreferencesTab /> : isNotificationsTab ? <NotificationsTab email={email} /> : isSecurityTab ? <SecurityTab email={email} mfaEnabled={mfaEnabled} /> : isSubscriptionTab ? <SubscriptionTab
        currentPlan={currentPlan}
        subscription={subscription}
        periodEndLabel={periodEndLabel}
        analysesToday={analysesToday}
        dailyAnalysisLimit={dailyAnalysisLimit}
        creditBalance={creditBalance}
        activity={activity}
        onOpenCancelModal={() => setCancelModalOpen(true)}
      /> : <ProfileTab
        email={email}
        initialUsername={initialUsername}
        initialPseudo={initialPseudo}
        initialAvatarUrl={initialAvatarUrl}
        memberSince={memberSince}
        googleConnected={googleConnected}
        mfaEnabled={mfaEnabled}
        currentPlan={currentPlan}
        subscription={subscription}
        periodEndLabel={periodEndLabel}
        activity={activity}
        onOpenCancelModal={() => setCancelModalOpen(true)}
        onOpenDeleteModal={() => setDeleteModalOpen(true)}
        deletionRequested={deletionRequested}
        actionError={actionError}
        creditBalance={creditBalance}
        referralSlug={referralSlug}
      />}
      </div>

      <CancelSubscriptionModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        confirming={cancelling}
        renewalDate={periodEndLabel ?? ""}
      />
      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </main>
    </DashboardChrome>
  );
}
