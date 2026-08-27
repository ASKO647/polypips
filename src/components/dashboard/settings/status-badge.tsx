import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  brand: "bg-brand-500/15 text-brand-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  amber: "bg-amber-500/15 text-amber-400",
  neutral: "bg-dash-surface-strong text-dash-text-secondary",
} as const;

/** Compact icon + label + value pill, used for the status row at the top
 * of Paramètres (plan/trial, daily AI quota, Smart Money monthly quota) —
 * same visual language as the pills already used in the dashboard header
 * and sidebar, just packing a label/value pair instead of a single line. */
export function StatusBadge({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  tone?: keyof typeof TONE_CLASSES;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-dash-border bg-dash-surface-alt py-1.5 pl-1.5 pr-3.5">
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          TONE_CLASSES[tone]
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[10px] font-medium text-dash-text-quaternary">{label}</span>
        <span className="mt-1 text-xs font-bold text-dash-text">{value}</span>
      </span>
    </div>
  );
}
