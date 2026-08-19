import { Link } from "@/i18n/navigation";
import { TrendingUp } from "lucide-react";
import type { PerformanceStats } from "@/lib/supabase/performance";
import { cn, formatSignedEUR } from "@/lib/utils";

/**
 * `stats === null` (or resolvedCount === 0) means no analysis has been
 * resolved yet for this user — resolve-markets hasn't confirmed any real
 * market outcome, so this mirrors StatsEmptyState's own honest empty
 * state rather than inventing numbers. Once real resolutions exist, every
 * number shown is real, but win rate/ROI/P&L are still a *simulation* of
 * what following each AI decision with a fixed theoretical stake would
 * have generated — never a claim about the user's actual money — labeled
 * as such directly on the card, not just in a tooltip.
 */
export function PerformanceCard({ stats }: { stats: PerformanceStats | null }) {
  if (!stats || stats.resolvedCount === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-white">
          Performance globale
        </h2>

        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 px-6 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.05]">
            <TrendingUp className="h-5 w-5 text-white/30" />
          </span>
          <p className="text-sm font-semibold text-white">
            Pas encore assez de données
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-white/45">
            Le suivi de performance (ROI, P&amp;L, win rate) se construit
            automatiquement dès qu&apos;un marché que vous avez analysé se
            résout — revenez une fois qu&apos;au moins une analyse aura été
            confirmée.
          </p>
        </div>

        <Link
          href="/dashboard/stats"
          className="mt-4 flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-sm font-semibold text-white/70 transition-colors hover:border-white/20 hover:text-white"
        >
          Voir toutes les statistiques →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-white">
          Performance globale
        </h2>
        <span className="shrink-0 text-[11px] font-semibold text-white/35">
          {stats.resolvedCount} résolue{stats.resolvedCount > 1 ? "s" : ""}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-white/35">
        Simulation basée sur les décisions de l&apos;IA — mise théorique de
        100 € par analyse, jamais un gain réel.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="font-display text-lg font-bold text-white">
            {Math.round(stats.winRate)}%
          </p>
          <p className="mt-0.5 text-[11px] text-white/40">Win rate</p>
        </div>
        <div>
          <p
            className={cn(
              "font-display text-lg font-bold",
              stats.simulatedRoi >= 0 ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {stats.simulatedRoi >= 0 ? "+" : ""}
            {stats.simulatedRoi.toFixed(1)}%
          </p>
          <p className="mt-0.5 text-[11px] text-white/40">ROI simulé</p>
        </div>
        <div>
          <p
            className={cn(
              "font-display text-lg font-bold",
              stats.simulatedPnl >= 0 ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {formatSignedEUR(stats.simulatedPnl)}
          </p>
          <p className="mt-0.5 text-[11px] text-white/40">P&amp;L simulé</p>
        </div>
      </div>

      <Link
        href="/dashboard/stats"
        className="mt-4 flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-sm font-semibold text-white/70 transition-colors hover:border-white/20 hover:text-white"
      >
        Voir toutes les statistiques →
      </Link>
    </div>
  );
}
