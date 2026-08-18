import { Crown, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDailyAnalysisLimit, PRICING_PLANS } from "@/lib/data/pricing";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";

export const PLAN_ICONS: Record<string, typeof Crown> = {
  decouverte: Rocket,
  pro: Crown,
};

export function AccountStatusCard({
  subscription,
  analysesToday,
}: {
  subscription: SubscriptionRow | null;
  analysesToday: number;
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

  const plan =
    PRICING_PLANS.find((p) => p.id === subscription.plan) ?? PRICING_PLANS[0];
  const PlanIcon = PLAN_ICONS[plan.id] ?? Crown;
  const dailyLimit = getDailyAnalysisLimit(plan);
  const isTrialing = subscription.status === "trialing";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
          <PlanIcon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="truncate text-sm font-semibold text-white">
          {plan.name}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs text-white/50">
          {dailyLimit !== null
            ? `${analysesToday}/${dailyLimit} analyses aujourd'hui`
            : "Analyses illimitées"}
        </p>
        {isTrialing && (
          <p className="text-xs font-semibold text-brand-400">
            Période d&apos;essai en cours
          </p>
        )}
        {subscription.status === "past_due" && (
          <p className="text-xs font-semibold text-amber-400">
            Paiement en échec
          </p>
        )}
      </div>

      <Button href="/dashboard/settings" size="sm" className="w-full">
        Changer de plan
      </Button>
    </div>
  );
}
