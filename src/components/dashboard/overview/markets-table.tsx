import { Link } from "@/i18n/navigation";
import { Sparkles } from "lucide-react";
import { isPrimaryDecision, type MarketAnalysis } from "@/lib/data/analysis";
import { cn } from "@/lib/utils";

/** Deterministic color for a market's category-initial "icon" — derived
 * from the real category string (no per-market logos exist in
 * selected_markets, so this never pretends to be an official brand icon).
 * A small fixed palette cycled by a simple string hash keeps it stable
 * across renders/reloads for the same category. */
const ICON_TONES = [
  "bg-brand-500/15 text-brand-400",
  "bg-emerald-500/15 text-emerald-400",
  "bg-amber-500/15 text-amber-400",
  "bg-sky-500/15 text-sky-400",
  "bg-violet-500/15 text-violet-400",
];

function categoryIconTone(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return ICON_TONES[hash % ICON_TONES.length];
}

export function MarketsTable({
  markets,
  onSelect,
}: {
  markets: MarketAnalysis[];
  onSelect: (market: MarketAnalysis) => void;
}) {
  return (
    <div className="rounded-2xl border border-dash-border bg-dash-surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-dash-text">
          Marchés sélectionnés par l&apos;IA
        </h2>
        <Link
          href="/dashboard/markets"
          className="text-xs font-semibold text-brand-400 transition-colors hover:text-brand-300"
        >
          Voir tous les marchés sélectionnés →
        </Link>
      </div>

      {markets.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-dash-border px-6 py-10 text-center">
          <Sparkles className="h-5 w-5 text-dash-text-faint" />
          <p className="text-sm text-dash-text-quaternary">
            Aucun marché sélectionné pour le moment. Notre IA scanne
            périodiquement les marchés les plus actifs.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wide text-dash-text-quaternary">
                  <th className="pb-3 pr-3 font-semibold">Marché</th>
                  <th className="pb-3 px-3 font-semibold">Probabilité IA</th>
                  <th className="pb-3 px-3 font-semibold">Probabilité marché</th>
                  <th className="pb-3 pl-3 font-semibold">Décision IA</th>
                </tr>
              </thead>
              <tbody>
                {markets.map((market) => {
                  const isPrimary = isPrimaryDecision(market.decision, market.outcomes);
                  return (
                    <tr
                      key={market.id}
                      onClick={() => onSelect(market)}
                      className="cursor-pointer border-t border-dash-border-soft transition-colors duration-150 hover:bg-dash-surface-hover"
                    >
                      <td className="py-3 pr-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                              categoryIconTone(market.category)
                            )}
                          >
                            {market.category.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-dash-text">
                              {market.question}
                            </p>
                            <p className="truncate text-xs text-dash-text-quaternary">
                              {market.category}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-dash-text">
                        {market.aiProbability}%
                      </td>
                      <td className="px-3 py-3 text-sm text-dash-text-secondary">
                        {market.marketProbability}%
                      </td>
                      <td className="py-3 pl-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
                            isPrimary
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-rose-500/15 text-rose-400"
                          )}
                        >
                          {market.decision}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Link
            href="/dashboard/markets"
            className="mt-4 flex w-full items-center justify-center rounded-xl border border-dash-border bg-dash-surface-alt py-2.5 text-sm font-semibold text-dash-text-secondary transition-colors hover:border-dash-border-strong hover:text-dash-text"
          >
            Voir tous les marchés
          </Link>
        </>
      )}
    </div>
  );
}
