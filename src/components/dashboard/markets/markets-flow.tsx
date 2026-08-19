"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { AnalysisResult } from "@/components/dashboard/analyse-ia/analysis-result";
import { MarketCard } from "@/components/dashboard/markets/market-card";
import { SyncCountdown } from "@/components/dashboard/sync-countdown";
import type { MarketAnalysis } from "@/lib/data/analysis";
import { SYNC_MARKETS_INTERVAL_MINUTES } from "@/lib/data/markets";
import { cn } from "@/lib/utils";

type SortKey = "opportunityScore" | "edge" | "aiProbability";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "opportunityScore", label: "Score" },
  { key: "edge", label: "Edge" },
  { key: "aiProbability", label: "Probabilité IA" },
];

const ALL_CATEGORIES = "Tous";

export function MarketsFlow({
  markets: allMarkets,
  hasActiveSubscription,
  lastSyncedAt,
}: {
  markets: MarketAnalysis[];
  hasActiveSubscription: boolean;
  lastSyncedAt: string | null;
}) {
  const [selected, setSelected] = useState<MarketAnalysis | null>(null);
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);
  const [sortKey, setSortKey] = useState<SortKey>("opportunityScore");

  const categories = useMemo(
    () => [
      ALL_CATEGORIES,
      ...Array.from(new Set(allMarkets.map((m) => m.category))),
    ],
    [allMarkets]
  );

  const markets = useMemo(() => {
    const filtered =
      category === ALL_CATEGORIES
        ? allMarkets
        : allMarkets.filter((m) => m.category === category);

    return [...filtered].sort((a, b) =>
      sortKey === "edge"
        ? Math.abs(b.edge) - Math.abs(a.edge)
        : b[sortKey] - a[sortKey]
    );
  }, [allMarkets, category, sortKey]);

  if (selected) {
    return (
      <AnalysisResult
        analysis={selected}
        onBack={() => setSelected(null)}
        backLabel="Retour à la liste"
        locked={!hasActiveSubscription}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Marchés sélectionnés par l&apos;IA
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
            Les opportunités identifiées par notre système aujourd&apos;hui.
          </p>
        </div>
        <SyncCountdown
          lastSyncedAt={lastSyncedAt}
          intervalMinutes={SYNC_MARKETS_INTERVAL_MINUTES}
        />
      </div>

      {allMarkets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
            <Sparkles className="h-5 w-5" strokeWidth={2} />
          </span>
          <p className="text-sm font-semibold text-white">
            Aucun marché sélectionné pour le moment
          </p>
          <p className="max-w-sm text-xs leading-relaxed text-white/45">
            Notre IA scanne périodiquement les marchés Polymarket les plus
            actifs. Revenez un peu plus tard pour voir les premières
            opportunités.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150",
                    category === cat
                      ? "border-brand-400 bg-brand-500/15 text-brand-400"
                      : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-white/40">Trier par</span>
              <div className="flex flex-wrap gap-1.5">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSortKey(opt.key)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
                      sortKey === opt.key
                        ? "border-white/25 bg-white/[0.1] text-white"
                        : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {markets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                onViewDetail={() => setSelected(market)}
                locked={!hasActiveSubscription}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
