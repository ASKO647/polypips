import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function UsageCircle({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: "brand" | "emerald" | "amber";
}) {
  const toneClasses = {
    brand: "bg-brand-500/15 text-brand-400",
    emerald: "bg-emerald-500/15 text-emerald-400",
    amber: "bg-amber-500/15 text-amber-400",
  }[tone];

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold",
          toneClasses
        )}
      >
        {value}
      </span>
      <span className="text-xs text-white/50">{label}</span>
    </div>
  );
}

export function UsageWidget({
  analysesRemaining,
  walletsFollowed,
  walletsMax,
  coachMessagesRemaining,
  isTopPlan,
}: {
  analysesRemaining: string;
  walletsFollowed: string;
  walletsMax: string;
  coachMessagesRemaining: string;
  isTopPlan: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-white">
          Votre usage ce mois-ci
        </h2>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <UsageCircle value={analysesRemaining} label="Analyses IA" tone="brand" />
        <UsageCircle
          value={`${walletsFollowed}/${walletsMax}`}
          label="Smart Money"
          tone="emerald"
        />
        <UsageCircle value={coachMessagesRemaining} label="Coach IA" tone="amber" />
      </div>

      {!isTopPlan && (
        <div className="mt-5 flex flex-col gap-2.5 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-semibold text-emerald-300">
            Passez au plan Pro+ → Tout illimité
          </span>
          <Button href="/dashboard/settings" size="sm" variant="outline">
            Changer de plan
          </Button>
        </div>
      )}
    </div>
  );
}
