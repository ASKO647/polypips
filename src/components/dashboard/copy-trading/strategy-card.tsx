"use client";

import { ArrowRight } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import type { Strategy } from "@/lib/data/copy-trading";
import { cn } from "@/lib/utils";

export function StrategyCard({
  strategy,
  onConfigure,
}: {
  strategy: Strategy;
  onConfigure: () => void;
}) {
  const positiveRoi = strategy.historicalRoi >= 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div>
        <p className="font-display text-base font-bold text-white">
          {strategy.name}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-white/55">
          {strategy.description}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-white/35">ROI historique</p>
          <p
            className={cn(
              "mt-0.5 font-semibold",
              positiveRoi ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {positiveRoi ? "+" : ""}
            {strategy.historicalRoi}%
          </p>
        </div>
        <div>
          <p className="text-white/35">Taux de réussite</p>
          <p className="mt-0.5 font-semibold text-white">
            {strategy.successRate}%
          </p>
        </div>
        <div>
          <p className="text-white/35">Trades copiés</p>
          <p className="mt-0.5 font-semibold text-white">
            {strategy.copiedTradesCount}
          </p>
        </div>
      </div>
      <p className="text-[11px] text-white/30">
        Statistiques historiques, non garantes des performances futures.
      </p>

      <Button
        type="button"
        variant="outline"
        onClick={onConfigure}
        className="mt-1 w-full"
      >
        Configurer cette stratégie
        <ButtonIcon variant="outline">
          <ArrowRight className="h-4 w-4" />
        </ButtonIcon>
      </Button>
    </div>
  );
}
