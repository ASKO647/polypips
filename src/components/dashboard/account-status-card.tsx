import { Crown, Gem, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDailyAnalysisLimit, PRICING_PLANS } from "@/lib/data/pricing";
import {
  MOCK_SUBSCRIPTION,
  MOCK_TRIAL_DAYS_REMAINING,
  MOCK_USAGE,
} from "@/lib/data/settings";

const PLAN_ICONS: Record<string, typeof Crown> = {
  decouverte: Rocket,
  pro: Crown,
  "pro-plus": Gem,
};

export function AccountStatusCard() {
  const plan =
    PRICING_PLANS.find((p) => p.id === MOCK_SUBSCRIPTION.planId) ??
    PRICING_PLANS[0];
  const PlanIcon = PLAN_ICONS[plan.id] ?? Crown;
  const dailyLimit = getDailyAnalysisLimit(plan);
  const isTrial = plan.id === "decouverte";

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
            ? `${MOCK_USAGE.analysesToday}/${dailyLimit} analyses aujourd'hui`
            : "Analyses illimitées"}
        </p>
        {isTrial && (
          <p className="text-xs font-semibold text-brand-400">
            {MOCK_TRIAL_DAYS_REMAINING} jours restants
          </p>
        )}
      </div>

      <Button href="/dashboard/settings" size="sm" className="w-full">
        Changer de plan
      </Button>
    </div>
  );
}
