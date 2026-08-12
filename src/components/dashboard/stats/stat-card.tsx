import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
        <Icon className="h-4.5 w-4.5" strokeWidth={2.25} />
      </span>
      <span className="flex flex-col">
        <span className="font-display text-xl font-bold text-white">
          {value}
        </span>
        <span className="text-xs font-medium text-white/40">{label}</span>
      </span>
    </div>
  );
}
