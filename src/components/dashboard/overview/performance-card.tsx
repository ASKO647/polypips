import Link from "next/link";
import { TrendingUp } from "lucide-react";

/**
 * No real per-user performance metric (ROI, P&L, win rate) exists in the
 * product today — analyses have an AI verdict but no tracked real-world
 * outcome, and wallet PnL belongs to the Smart Money wallets being
 * followed, not to the user. This mirrors StatsEmptyState's own honest
 * empty state rather than inventing numbers to fill the card. See that
 * component (and the demo-mode gate on /dashboard/stats) for the same
 * reasoning applied to the Statistiques page.
 */
export function PerformanceCard() {
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
          Le suivi de performance (ROI, P&amp;L, win rate) se construit à
          partir de votre historique réel — revenez une fois que vous aurez
          accumulé de l&apos;activité.
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
