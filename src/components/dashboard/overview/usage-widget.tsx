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
}: {
  analysesRemaining: string;
  walletsFollowed: string;
  walletsMax: string;
  coachMessagesRemaining: string;
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
    </div>
  );
}
