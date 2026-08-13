import { cn } from "@/lib/utils";

/** Renders a wallet's change_percent — a neutral dash while there isn't
 * yet a second wallet_snapshots data point to compare against, since a
 * colored +/-0.0% badge would falsely claim a direction we don't know. */
export function ChangeBadge({
  changePercent,
  className,
}: {
  changePercent: number | null;
  className?: string;
}) {
  if (changePercent === null) {
    return (
      <span
        className={cn(
          "shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-bold text-white/40",
          className
        )}
      >
        —
      </span>
    );
  }

  const positive = changePercent >= 0;
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
        positive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400",
        className
      )}
    >
      {positive ? "+" : ""}
      {changePercent.toFixed(1)}%
    </span>
  );
}
