import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

/** One of the Overview page's 4 KPI tiles. `value === null` renders "—"
 * with a quiet "Pas encore de données" caption instead of a fabricated
 * count — matches-analyzed-today and opportunities-detected are genuinely
 * 0 today (no detection pipeline runs yet), which is different from "no
 * data available" and rendered as a real 0. */
export function StatTile({
  icon: Icon,
  label,
  value,
  caption,
  tone = "default",
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number | string | null;
  caption?: string;
  tone?: "default" | "emerald" | "brand";
}) {
  const iconToneClass = {
    default: "bg-white/[0.06] text-white/50",
    emerald: "bg-emerald-500/15 text-emerald-400",
    brand: "bg-brand-500/15 text-brand-400",
  }[tone];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", iconToneClass)}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div>
        <p className="font-display text-2xl font-bold text-white">
          {value === null ? "—" : value}
        </p>
        <p className="mt-0.5 text-xs font-medium text-white/45">{label}</p>
        {caption && <p className="mt-1 text-[11px] text-white/30">{caption}</p>}
      </div>
    </div>
  );
}
