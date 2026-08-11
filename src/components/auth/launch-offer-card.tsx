import { Gift } from "lucide-react";
import { Countdown } from "@/components/ui/countdown";
import { getDefaultLaunchDeadline } from "@/lib/deadline";

export function LaunchOfferCard() {
  const deadline = getDefaultLaunchDeadline();

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-surface p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
          <Gift className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">Offre de lancement</p>
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold text-brand-600">
              0,99 €
            </span>
            <span className="text-xs font-medium text-body-soft">
              pendant 3 jours
            </span>
          </p>
        </div>
      </div>

      <p className="text-xs font-medium text-body-soft">
        Puis 29,99&nbsp;€&nbsp;/&nbsp;mois pendant 30 jours
      </p>

      <Countdown deadline={deadline} variant="blocks" />
    </div>
  );
}
