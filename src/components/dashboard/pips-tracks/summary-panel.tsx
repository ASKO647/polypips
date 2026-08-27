import { ChevronRight, Info } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { PipsTrackSummary } from "@/lib/data/pips-tracks";

function Row({ label, value, tone }: { label: string; value: number; tone?: "up" | "down" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/50">{label}</span>
      <span
        className={
          tone === "up"
            ? "text-sm font-bold text-emerald-400"
            : tone === "down"
              ? "text-sm font-bold text-rose-400"
              : "text-sm font-bold text-white"
        }
      >
        {new Intl.NumberFormat("fr-FR").format(value)}
      </span>
    </div>
  );
}

export function SummaryPanel({ summary }: { summary: PipsTrackSummary | null }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-1.5">
        <h2 className="text-sm font-bold text-white">Résumé en temps réel</h2>
        <Info className="h-3.5 w-3.5 text-white/30" strokeWidth={2} />
      </div>

      {summary ? (
        <div className="flex flex-col gap-2.5">
          <Row label="Événements aujourd'hui" value={summary.eventsToday} />
          <Row label="Signaux IA" value={summary.signalsToday} />
          <Row label="Achats détectés" value={summary.buysToday} tone="up" />
          <Row label="Ventes détectées" value={summary.sellsToday} tone="down" />
          <Row label="Wallets actifs" value={summary.activeWallets} />
        </div>
      ) : (
        <p className="text-xs text-white/40">Statistiques indisponibles pour le moment.</p>
      )}

      <Link
        href="/dashboard/stats"
        className="mt-1 flex items-center gap-1 text-xs font-semibold text-brand-400 transition-colors hover:text-brand-300"
      >
        Voir les statistiques complètes
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
      </Link>
    </div>
  );
}
