import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

/** The one honest-empty-state shape reused across the whole Sports module
 * — same visual language as Statistiques' StatsEmptyState. Every
 * analytical section (probabilities, opportunities, comparison, H2H,
 * lineups, odds, model accuracy...) renders this instead of a plausible
 * mock number until a real data/AI source is connected. */
export function SportsEmptyState({
  icon: Icon,
  title,
  message,
  compact = false,
  className,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  message: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center",
        compact ? "py-8" : "py-14",
        className
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.05]">
        <Icon className="h-5 w-5 text-white/30" strokeWidth={2} />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="max-w-sm text-xs leading-relaxed text-white/45">{message}</p>
      </div>
    </div>
  );
}
