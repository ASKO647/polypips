"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Sparkles } from "lucide-react";
import { PLAN_ICONS } from "@/components/dashboard/account-status-card";
import { StatusBadge } from "@/components/dashboard/settings/status-badge";
import { ProfileTab } from "@/components/dashboard/settings/profile-tab";
import { CancelSubscriptionModal } from "@/components/dashboard/settings/cancel-subscription-modal";
import { DeleteAccountModal } from "@/components/dashboard/settings/delete-account-modal";
import { getPricingPlans, type PricingPlan } from "@/lib/data/pricing";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";
import type { ProfileActivityStats } from "@/lib/supabase/profile-activity";

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

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
}) {
  const router = useRouter();
  const t = useTranslations("Profile.SettingsFlow");
  const tPlans = useTranslations("Plans");
  const [subscription, setSubscription] = useState(initialSubscription);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);

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
    ? (getPricingPlans(tPlans).find((p) => p.id === subscription.plan) ?? null)
    : null;
  const periodEndLabel = subscription?.currentPeriodEnd
    ? DATE_FORMATTER.format(new Date(subscription.currentPeriodEnd))
    : null;

  const PlanIcon = PLAN_ICONS[plan.id] ?? PLAN_ICONS.pro;
  const planBadgeValue =
    trialDaysRemaining !== null ? t("trialDaysBadge", { days: trialDaysRemaining }) : plan.name;
  const analysesRemaining = dailyAnalysisLimit !== null ? dailyAnalysisLimit - analysesToday : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-dash-text sm:text-3xl">
            {t("heading")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-dash-text-tertiary sm:text-base">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge icon={PlanIcon} label={t("planBadgeLabel")} value={planBadgeValue} tone="brand" />
          <StatusBadge
            icon={Sparkles}
            label={t("analysesBadgeLabel")}
            value={
              analysesRemaining !== null
                ? t("analysesRemaining", { count: Math.max(analysesRemaining, 0) })
                : t("analysesUnlimited")
            }
            tone={analysesRemaining !== null && analysesRemaining <= 0 ? "amber" : "emerald"}
          />
        </div>
      </div>

      <ProfileTab
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
      />

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
