import { Link } from "@/i18n/navigation";
import type { ComponentType } from "react";
import { WalletChart } from "@/components/dashboard/smart-money/wallet-chart";
import { cn } from "@/lib/utils";

export function QuickAccessCard({
  href,
  icon: Icon,
  title,
  stat,
  tone = "brand",
  badge,
  sparklinePoints,
}: {
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  stat: string;
  tone?: "brand" | "emerald" | "amber" | "neutral";
  badge?: string;
  /** Real daily activity counts (oldest→newest) — an all-zero array (no
   * real trend to show) renders as a flat neutral line, never a fabricated
   * upward trend. Omit entirely to skip the sparkline (e.g. the
   * subscription status card, which has no activity metric). */
  sparklinePoints?: number[];
}) {
  const toneClasses = {
    brand: "bg-brand-500/15 text-brand-400",
    emerald: "bg-emerald-500/15 text-emerald-400",
    amber: "bg-amber-500/15 text-amber-400",
    neutral: "bg-white/10 text-white/70",
  }[tone];

  const hasActivity = sparklinePoints?.some((v) => v > 0) ?? false;

  return (
    <Link
      href={href}
      prefetch
      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.05]"
    >
      <div className="flex items-center justify-between">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneClasses)}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        {badge && (
          <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-400">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="mt-0.5 text-xs text-white/45">{stat}</p>
      </div>
      {sparklinePoints && (
        <div className="-mx-1 h-7">
          <WalletChart
            points={sparklinePoints}
            positive
            tone={hasActivity ? tone : "neutral"}
          />
        </div>
      )}
    </Link>
  );
}
