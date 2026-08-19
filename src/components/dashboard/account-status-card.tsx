import { Crown, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRICING_PLANS } from "@/lib/data/pricing";
import { getTrialDaysRemaining, type SubscriptionRow } from "@/lib/supabase/subscriptions";
import { formatResetDate } from "@/lib/utils";

const DECOUVERTE_PLAN = PRICING_PLANS.find((p) => p.id === "decouverte") ?? PRICING_PLANS[0];
const PRO_PLAN = PRICING_PLANS.find((p) => p.id === "pro") ?? PRICING_PLANS[0];

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
  if (!subscription) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
        <p className="text-sm font-semibold text-white">Aucun abonnement</p>
        <p className="text-xs text-white/50">
          Débloquez les résultats d&apos;analyse en clair.
        </p>
        <Button href="/#tarifs" size="sm" className="w-full">
          Voir les offres
        </Button>
      </div>
    );
  }

  const trialDays = getTrialDaysRemaining(subscription);

  if (subscription.status === "trialing" && trialDays !== null) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
            <Rocket className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="text-sm font-semibold text-white">Offre découverte</span>
        </div>

        <div>
          <p className="text-xs text-white/50">
            Votre offre découverte expire dans :
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-brand-400">
            {trialDays} jour{trialDays > 1 ? "s" : ""}
          </p>
        </div>

        <p className="text-xs text-white/60">
          Accès complet à toutes les fonctionnalités
        </p>

        <p className="text-[11px] text-white/35">
          Puis {PRO_PLAN.price}{PRO_PLAN.priceSuffix}
        </p>
      </div>
    );
  }

  const cancelled = subscription.cancelAtPeriodEnd || subscription.status === "canceled";
  const pastDue = subscription.status === "past_due";
  const plan = subscription.plan === "pro" ? PRO_PLAN : DECOUVERTE_PLAN;
  const PlanIcon = PLAN_ICONS[plan.id] ?? Crown;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
          <PlanIcon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="truncate text-sm font-semibold text-white">{plan.name}</span>
      </div>

      {pastDue ? (
        <p className="text-xs font-semibold text-amber-400">Paiement en échec</p>
      ) : cancelled ? (
        <p className="text-xs font-semibold text-white/60">
          {subscription.currentPeriodEnd
            ? `Se termine le ${formatResetDate(subscription.currentPeriodEnd)}`
            : "Abonnement annulé"}
        </p>
      ) : (
        <p className="text-xs text-white/50">
          {subscription.currentPeriodEnd
            ? `Renouvellement le ${formatResetDate(subscription.currentPeriodEnd)}`
            : "Abonnement actif"}
        </p>
      )}
    </div>
  );
}
