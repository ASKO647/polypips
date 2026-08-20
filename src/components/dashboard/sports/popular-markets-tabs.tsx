"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import type { PopularMarket } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

export function PopularMarketsTabs({ markets }: { markets: PopularMarket[] }) {
  const [activeKey, setActiveKey] = useState(markets[0]?.key);
  const active = markets.find((m) => m.key === activeKey) ?? markets[0];

  if (!active) return null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-1.5">
        <h3 className="font-display text-sm font-semibold text-white">
          Analyse des marchés populaires
        </h3>
        <Info className="h-3.5 w-3.5 text-white/30" strokeWidth={2} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {markets.map((market) => (
          <button
            key={market.key}
            type="button"
            onClick={() => setActiveKey(market.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
              activeKey === market.key
                ? "border-brand-400 bg-brand-500/15 text-brand-400"
                : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"
            )}
          >
            {market.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {active.outcomes.map((outcome) => (
          <div key={outcome.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs font-medium text-white/70">
              {outcome.label}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${outcome.probabilityPercent}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs font-bold text-white">
              {outcome.probabilityPercent}%
            </span>
            <span className="w-12 shrink-0 text-right text-xs font-medium text-white/40">
              {outcome.odds !== null ? outcome.odds.toFixed(2) : "—"}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-white/30">
        Les cotes sont affichées à titre indicatif lorsqu&apos;une source de bookmaker est connectée —
        &quot;—&quot; signifie qu&apos;aucune cote réelle n&apos;est disponible pour ce marché.
      </p>
    </div>
  );
}
