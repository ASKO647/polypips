"use client";

import { ArrowRight } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import type { Strategy } from "@/lib/data/copy-trading";
import { cn, formatEUR } from "@/lib/utils";

export function StrategyCard({
  strategy,
  suggestionCount,
  onConfigure,
  onManage,
}: {
  strategy: Strategy;
  suggestionCount: number;
  onConfigure: () => void;
  onManage: () => void;
}) {
  const configured = strategy.strategyId !== null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-base font-bold text-white">
            {strategy.walletLabel}
          </p>
          {configured && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                strategy.status === "active"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-amber-500/15 text-amber-400"
              )}
            >
              {strategy.status === "active" ? "Active" : "En pause"}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-white/55">
          Portefeuille suivi : {formatEUR(strategy.walletTotalValue)} sous
          gestion actuellement.
        </p>
      </div>

      {configured && strategy.riskParameters ? (
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-white/35">Montant max</p>
            <p className="mt-0.5 font-semibold text-white">
              {formatEUR(strategy.riskParameters.maxPositionAmount)}
            </p>
          </div>
          <div>
            <p className="text-white/35">Exposition max</p>
            <p className="mt-0.5 font-semibold text-white">
              {strategy.riskParameters.maxExposure}%
            </p>
          </div>
          <div>
            <p className="text-white/35">Suggestions reçues</p>
            <p className="mt-0.5 font-semibold text-white">{suggestionCount}</p>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-white/30">
          Configurez vos paramètres de risque pour recevoir une alerte quand
          ce portefeuille bouge.
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={configured ? onManage : onConfigure}
        className="mt-1 w-full"
      >
        {configured ? "Gérer cette stratégie" : "Configurer cette stratégie"}
        <ButtonIcon variant="outline">
          <ArrowRight className="h-4 w-4" />
        </ButtonIcon>
      </Button>
    </div>
  );
}
