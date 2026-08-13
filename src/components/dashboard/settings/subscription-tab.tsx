import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PricingPlan } from "@/lib/data/pricing";
import type { PayingPlanId } from "@/lib/stripe/plans";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  trialing: { label: "Essai", className: "bg-brand-500/15 text-brand-400" },
  active: { label: "Actif", className: "bg-emerald-500/15 text-emerald-400" },
  past_due: {
    label: "Paiement en échec",
    className: "bg-amber-500/15 text-amber-400",
  },
  canceled: { label: "Terminé", className: "bg-white/10 text-white/50" },
};

export function SubscriptionTab({
  subscription,
  plan,
  periodEndLabel,
  changeablePlans,
  changingPlan,
  actionError,
  onChangePlan,
  onOpenCancelModal,
}: {
  subscription: SubscriptionRow | null;
  plan: PricingPlan | null;
  periodEndLabel: string | null;
  changeablePlans: { id: PayingPlanId; target: PricingPlan }[];
  changingPlan: PayingPlanId | null;
  actionError: string | null;
  onChangePlan: (id: PayingPlanId) => void;
  onOpenCancelModal: () => void;
}) {
  const badge = subscription ? STATUS_BADGE[subscription.status] : null;
  const hasAccess =
    subscription?.status === "active" || subscription?.status === "trialing";

  if (!subscription || !plan) {
    return (
      <div>
        <p className="text-sm text-white/60">
          Vous n&apos;avez pas d&apos;abonnement actif.
        </p>
        <div className="mt-5">
          <Button href="/#tarifs">Voir les offres</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-white">
            {plan.name}
          </span>
          <span className="text-sm text-white/50">
            {plan.price} {plan.priceSuffix}
          </span>
        </div>
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
            {changeablePlans.map(({ id, target }) => (
              <button
                key={id}
                type="button"
                disabled={changingPlan !== null}
                onClick={() => onChangePlan(id)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-white transition-colors duration-150 hover:border-white/25 hover:bg-white/[0.08] disabled:opacity-60"
              >
                {changingPlan === id
                  ? "Changement en cours..."
                  : `Passer à ${target.name} (${target.price}${target.priceSuffix})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasAccess && !subscription.cancelAtPeriodEnd && (
        <div className="mt-5">
          <button
            type="button"
            onClick={onOpenCancelModal}
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
    </div>
  );
}
