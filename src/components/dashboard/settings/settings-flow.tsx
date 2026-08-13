"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2 } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/ui/language-selector";
import { ChangePasswordButton } from "@/components/dashboard/settings/change-password-button";
import { CancelSubscriptionModal } from "@/components/dashboard/settings/cancel-subscription-modal";
import { DeleteAccountModal } from "@/components/dashboard/settings/delete-account-modal";
import { SettingsToggle } from "@/components/dashboard/settings/settings-toggle";
import { PRICING_PLANS } from "@/lib/data/pricing";
import type { PayingPlanId } from "@/lib/stripe/plans";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/data/settings";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";
import { cn } from "@/lib/utils";

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  trialing: { label: "Essai", className: "bg-brand-500/15 text-brand-400" },
  active: { label: "Actif", className: "bg-emerald-500/15 text-emerald-400" },
  past_due: { label: "Paiement en échec", className: "bg-amber-500/15 text-amber-400" },
  canceled: { label: "Terminé", className: "bg-white/10 text-white/50" },
};

const PAYING_PLAN_IDS: PayingPlanId[] = ["pro", "pro-plus"];

export function SettingsFlow({
  email,
  memberSince,
  initialSubscription,
}: {
  email: string;
  memberSince: string;
  initialSubscription: SubscriptionRow | null;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [subscription, setSubscription] = useState(initialSubscription);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [changingPlan, setChangingPlan] = useState<PayingPlanId | null>(null);
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

  const handleChangePlan = async (newPlan: PayingPlanId) => {
    setChangingPlan(newPlan);
    setActionError(null);
    try {
      const response = await fetch("/api/stripe/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setSubscription((prev) => (prev ? { ...prev, plan: newPlan } : prev));
      setTimeout(() => router.refresh(), 1500);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Le changement de plan a échoué. Réessayez."
      );
    } finally {
      setChangingPlan(null);
    }
  };

  const handleConfirmDelete = () => {
    console.log("Demande de suppression de compte déclenchée (mock, non branchée à Supabase).");
    setDeletionRequested(true);
    setDeleteModalOpen(false);
  };

  const plan = subscription
    ? PRICING_PLANS.find((p) => p.id === subscription.plan)
    : null;
  const badge = subscription ? STATUS_BADGE[subscription.status] : null;
  const periodEndLabel = subscription?.currentPeriodEnd
    ? DATE_FORMATTER.format(new Date(subscription.currentPeriodEnd))
    : null;
  const hasAccess =
    subscription?.status === "active" || subscription?.status === "trialing";
  const changeablePlans = subscription
    ? PAYING_PLAN_IDS.filter((id) => id !== subscription.plan)
    : [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Paramètres
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Gérez votre compte, votre abonnement et vos préférences.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-white">
          Compte
        </h2>

        <div className="mt-4 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Email
            </p>
            <p className="mt-1 text-sm text-white/80">{email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Membre depuis
            </p>
            <p className="mt-1 text-sm text-white/80">{memberSince}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-start">
          <ChangePasswordButton email={email} />
          <SignOutButton />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-white">
            Abonnement
          </h2>
          {badge && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-bold",
                badge.className
              )}
            >
              {badge.label}
            </span>
          )}
        </div>

        {!subscription || !plan ? (
          <>
            <p className="mt-4 text-sm text-white/60">
              Vous n&apos;avez pas d&apos;abonnement actif.
            </p>
            <div className="mt-5">
              <Button href="/#tarifs">Voir les offres</Button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-white">
                {plan.name}
              </span>
              <span className="text-sm text-white/50">
                {plan.price} {plan.priceSuffix}
              </span>
            </div>

            <ul className="mt-4 flex flex-col gap-2">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-white/70"
                >
                  <Check
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400"
                    strokeWidth={2.5}
                  />
                  {feature}
                </li>
              ))}
            </ul>

            {periodEndLabel && (
              <p className="mt-4 text-xs text-white/35">
                {subscription.status === "canceled"
                  ? `Abonnement terminé le ${periodEndLabel}`
                  : subscription.cancelAtPeriodEnd
                    ? `Annulation prévue — accès jusqu'au ${periodEndLabel}`
                    : `Renouvellement le ${periodEndLabel}`}
              </p>
            )}

            {actionError && (
              <p className="mt-3 text-xs font-medium text-rose-400">
                {actionError}
              </p>
            )}

            {hasAccess && changeablePlans.length > 0 && (
              <div className="mt-5 flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                  Changer de plan
                </p>
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  {changeablePlans.map((id) => {
                    const target = PRICING_PLANS.find((p) => p.id === id)!;
                    return (
                      <button
                        key={id}
                        type="button"
                        disabled={changingPlan !== null}
                        onClick={() => handleChangePlan(id)}
                        className="flex h-11 flex-1 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-white transition-colors duration-150 hover:border-white/25 hover:bg-white/[0.08] disabled:opacity-60"
                      >
                        {changingPlan === id
                          ? "Changement en cours..."
                          : `Passer à ${target.name} (${target.price}${target.priceSuffix})`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {hasAccess && !subscription.cancelAtPeriodEnd && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(true)}
                  className="flex h-11 w-full items-center justify-center rounded-full border border-rose-400/25 bg-rose-500/[0.06] px-5 text-sm font-semibold text-rose-400 transition-colors duration-150 hover:border-rose-400/40 sm:w-auto"
                >
                  Annuler l&apos;abonnement
                </button>
              </div>
            )}

            {subscription.status === "canceled" && (
              <div className="mt-5">
                <Button href="/#tarifs">Se réabonner</Button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-white">
          Préférences
        </h2>

        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5">
          <span className="text-sm font-medium text-white">Langue</span>
          <LanguageSelector />
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
            Notifications
          </p>
          {notifications.map((notification) => (
            <SettingsToggle
              key={notification.id}
              label={notification.label}
              checked={notification.enabled}
              onChange={() => toggleNotification(notification.id)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-rose-400">
          Zone danger
        </h2>
        <p className="mt-2 text-sm text-white/50">
          La suppression de votre compte est définitive et irréversible.
        </p>

        {deletionRequested ? (
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-white/70">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            Demande de suppression enregistrée. Notre équipe vous contactera
            par email.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="mt-4 flex h-11 items-center justify-center rounded-full bg-rose-500 px-6 text-sm font-semibold text-white transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
          >
            Supprimer mon compte
          </button>
        )}
      </section>

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
