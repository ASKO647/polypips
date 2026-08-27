"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Sparkles, Wallet } from "lucide-react";
import { PLAN_ICONS } from "@/components/dashboard/account-status-card";
import { StatusBadge } from "@/components/dashboard/settings/status-badge";
import { SettingsTabs, type SettingsTabId } from "@/components/dashboard/settings/settings-tabs";
import { ProfileTab } from "@/components/dashboard/settings/profile-tab";
import { PasswordTab } from "@/components/dashboard/settings/password-tab";
import { SubscriptionTab } from "@/components/dashboard/settings/subscription-tab";
import { NotificationsTab } from "@/components/dashboard/settings/notifications-tab";
import { ReferralTab } from "@/components/dashboard/settings/referral-tab";
import { TiktokTab } from "@/components/dashboard/settings/tiktok-tab";
import { CancelSubscriptionModal } from "@/components/dashboard/settings/cancel-subscription-modal";
import { DeleteAccountModal } from "@/components/dashboard/settings/delete-account-modal";
import { PRICING_PLANS, type PricingPlan } from "@/lib/data/pricing";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/data/settings";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";
import type { ReferralHistoryItem, ReferralStats } from "@/lib/data/referrals";
import type { TiktokSubmission } from "@/lib/data/tiktok-clips";

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function SettingsFlow({
  email,
  initialUsername,
  initialSubscription,
  plan,
  analysesToday,
  dailyAnalysisLimit,
  trialDaysRemaining,
  walletQuotaCount,
  walletQuotaMax,
  referralOrigin,
  initialReferralSlug,
  referralStats,
  referralHistory,
  tiktokSubmissions,
}: {
  email: string;
  initialUsername: string;
  initialSubscription: SubscriptionRow | null;
  plan: PricingPlan;
  analysesToday: number;
  dailyAnalysisLimit: number | null;
  /** Days left in the discovery trial, or null when not currently trialing. */
  trialDaysRemaining: number | null;
  walletQuotaCount: number;
  /** null = unlimited (both plans are unlimited on this quota now). */
  walletQuotaMax: number | null;
  referralOrigin: string;
  initialReferralSlug: string | null;
  referralStats: ReferralStats;
  referralHistory: ReferralHistoryItem[];
  tiktokSubmissions: TiktokSubmission[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTabId>("profile");
  const [notifications, setNotifications] = useState(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [subscription, setSubscription] = useState(initialSubscription);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  };

  const handleConfirmCancel = async () => {
    setCancelling(true);
    setActionError(null);
    try {
      const response = await fetch("/api/stripe/cancel", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setSubscription((prev) => (prev ? { ...prev, cancelAtPeriodEnd: true } : prev));
      setCancelModalOpen(false);
      setTimeout(() => router.refresh(), 1500);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "L'annulation a échoué. Réessayez."
      );
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
    ? (PRICING_PLANS.find((p) => p.id === subscription.plan) ?? null)
    : null;
  const periodEndLabel = subscription?.currentPeriodEnd
    ? DATE_FORMATTER.format(new Date(subscription.currentPeriodEnd))
    : null;

  const PlanIcon = PLAN_ICONS[plan.id] ?? PLAN_ICONS.pro;
  const planBadgeValue = trialDaysRemaining !== null ? `${trialDaysRemaining}J d'essai` : plan.name;
  const analysesRemaining = dailyAnalysisLimit !== null ? dailyAnalysisLimit - analysesToday : null;
  const walletsLocked = walletQuotaMax !== null && walletQuotaCount >= walletQuotaMax;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Paramètres
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
            Gérez votre compte, votre abonnement et vos préférences.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge icon={PlanIcon} label="Plan" value={planBadgeValue} tone="brand" />
          <StatusBadge
            icon={Sparkles}
            label="Analyses IA"
            value={
              analysesRemaining !== null
                ? `${Math.max(analysesRemaining, 0)} restantes`
                : "Illimitées"
            }
            tone={analysesRemaining !== null && analysesRemaining <= 0 ? "amber" : "emerald"}
          />
          <StatusBadge
            icon={Wallet}
            label="Smart Money"
            value={
              walletQuotaMax !== null
                ? `${walletQuotaCount}/${walletQuotaMax} wallets`
                : "Illimité"
            }
            tone={walletsLocked ? "amber" : "neutral"}
          />
        </div>
      </div>

      <SettingsTabs active={activeTab} onChange={setActiveTab} />

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        {activeTab === "profile" && (
          <ProfileTab
            email={email}
            initialUsername={initialUsername}
            onOpenDeleteModal={() => setDeleteModalOpen(true)}
            deletionRequested={deletionRequested}
          />
        )}
        {activeTab === "password" && <PasswordTab email={email} />}
        {activeTab === "subscription" && (
          <SubscriptionTab
            subscription={subscription}
            plan={currentPlan}
            periodEndLabel={periodEndLabel}
            actionError={actionError}
            onOpenCancelModal={() => setCancelModalOpen(true)}
          />
        )}
        {activeTab === "notifications" && (
          <NotificationsTab
            notifications={notifications}
            onToggle={toggleNotification}
          />
        )}
        {activeTab === "referral" && (
          <ReferralTab
            origin={referralOrigin}
            initialSlug={initialReferralSlug}
            stats={referralStats}
            history={referralHistory}
          />
        )}
        {activeTab === "tiktok" && <TiktokTab initialSubmissions={tiktokSubmissions} />}
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
    </div>
  );
}
