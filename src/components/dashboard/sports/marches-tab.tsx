import { TrendingUp } from "lucide-react";
import { SportsEmptyState } from "@/components/dashboard/sports/sports-empty-state";
import type { MarketEdgeRow, PopularMarket } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

function MarketBlock({ market }: { market: PopularMarket }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{market.label}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {market.outcomes.map((outcome) => (
          <div key={outcome.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
            <p className="text-[11px] text-white/45">{outcome.label}</p>
            <p className="mt-1 font-display text-lg font-bold text-white">
              {outcome.probabilityPercent === null ? "—" : `${outcome.probabilityPercent}%`}
            </p>
            <p className="mt-0.5 text-[11px] text-white/35">
              {outcome.odds !== null ? outcome.odds.toFixed(2) : "Cote —"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EdgeRow({ row }: { row: MarketEdgeRow }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-xs">
      <span className="font-semibold text-white">{row.marketLabel}</span>
      <div className="flex items-center gap-4 text-white/50">
        <span>{row.probabilityPercent !== null ? `${row.probabilityPercent}%` : "—"}</span>
        <span>{row.marketOdds !== null ? row.marketOdds.toFixed(2) : "—"}</span>
        <span>{row.fairOdds !== null ? row.fairOdds.toFixed(2) : "—"}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-bold",
            row.edgePercent === null
              ? "bg-white/10 text-white/40"
              : row.edgePercent >= 0
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-rose-500/15 text-rose-400"
          )}
        >
          {row.edgePercent === null ? "—" : `${row.edgePercent >= 0 ? "+" : ""}${row.edgePercent}%`}
        </span>
      </div>
    </div>
  );
}

export function MarchesTab({
  popularMarkets,
  marketEdges,
}: {
  popularMarkets: PopularMarket[];
  marketEdges: MarketEdgeRow[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 font-display text-sm font-semibold text-white">Marchés principaux</h3>
        {popularMarkets.length === 0 ? (
          <SportsEmptyState
            icon={TrendingUp}
            title="Marchés pas encore disponibles"
            message="1X2, Total de buts, BTTS et les autres marchés s'afficheront ici avec leur probabilité dès qu'un modèle réel sera connecté."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {popularMarkets.map((market) => (
              <MarketBlock key={market.key} market={market} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-display text-sm font-semibold text-white">Meilleures opportunités</h3>
        {marketEdges.length === 0 ? (
          <SportsEmptyState
            icon={TrendingUp}
            title="Aucune opportunité de marché détectée"
            message="Probabilité, cote marché, cote juste et edge calculé s'afficheront ici une fois une source de cotes et un modèle connectés."
            compact
          />
        ) : (
          <div className="flex flex-col divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.03] px-4">
            <div className="flex items-center justify-between py-2 text-[10px] font-semibold uppercase tracking-wide text-white/30">
              <span>Marché</span>
              <div className="flex items-center gap-4">
                <span>Prob.</span>
                <span>Cote marché</span>
                <span>Cote juste</span>
                <span>Edge</span>
              </div>
            </div>
            {marketEdges.map((row) => (
              <EdgeRow key={row.marketLabel} row={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
