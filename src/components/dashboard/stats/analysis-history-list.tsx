import { Clock } from "lucide-react";
import type { ResolvedAnalysis } from "@/lib/data/stats";
import { cn } from "@/lib/utils";

export function AnalysisHistoryList({
  items,
}: {
  items: ResolvedAnalysis[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <p className="truncate text-sm font-medium text-white">
              {item.question}
            </p>
            <span className="flex items-center gap-1.5 text-xs text-white/40">
              <Clock className="h-3 w-3" />
              {item.date} · {item.category} · Décision {item.decision}
            </span>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
              item.outcome === "Correct"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-rose-500/15 text-rose-400"
            )}
          >
            {item.outcome}
          </span>
        </div>
      ))}
    </div>
  );
}
