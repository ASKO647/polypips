import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import type { MarketAnalysis } from "@/lib/data/analysis";
import { cn } from "@/lib/utils";

export function RecentMarketsSection({
  markets,
  onSelect,
}: {
  markets: MarketAnalysis[];
  onSelect: (market: MarketAnalysis) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-white">
          Marchés en ce moment
        </h2>
        <Link
          href="/dashboard/markets"
          className="text-xs font-semibold text-brand-400 transition-colors hover:text-brand-300"
        >
          Voir tous les marchés sélectionnés →
        </Link>
      </div>

      {markets.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 px-6 py-10 text-center">
          <Sparkles className="h-5 w-5 text-white/25" />
          <p className="text-sm text-white/40">
            Aucun marché sélectionné pour le moment. Notre IA scanne
            périodiquement les marchés les plus actifs.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {markets.map((market) => {
            const isYes = market.decision === "YES";
            return (
              <div
                key={market.id}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {market.question}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span
                      className={cn(
                        "font-bold",
                        isYes ? "text-emerald-400" : "text-rose-400"
                      )}
                    >
                      {market.decision} {market.aiProbability}%
                    </span>
                    <span
                      className={cn(
                        "font-semibold",
                        market.edge >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}
                    >
                      Edge {market.edge >= 0 ? "+" : ""}
                      {market.edge}%
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onSelect(market)}
                  className="shrink-0"
                >
                  Voir l&apos;analyse
                  <ButtonIcon variant="outline">
                    <ArrowRight className="h-4 w-4" />
                  </ButtonIcon>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
