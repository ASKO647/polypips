"use client";

import { Pause, Play, Square } from "lucide-react";
import { RiskDisclaimer } from "@/components/dashboard/copy-trading/risk-disclaimer";
import type { RiskParameters, Strategy } from "@/lib/data/copy-trading";
import { cn, formatEUR, formatSignedEUR } from "@/lib/utils";

export function StrategyActive({
  strategy,
  params,
  isPaused,
  onTogglePause,
  onStop,
}: {
  strategy: Strategy;
  params: RiskParameters;
  isPaused: boolean;
  onTogglePause: () => void;
  onStop: () => void;
}) {
  const closed = strategy.copiedPositions.filter(
    (p) => p.status === "Clôturée"
  );
  const wins = closed.filter((p) => (p.result ?? 0) >= 0).length;
  const totalPnl = closed.reduce((sum, p) => sum + (p.result ?? 0), 0);
  const winRate =
    closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Copy Trading
      </h1>

      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5",
          isPaused
            ? "border-amber-400/20 bg-amber-500/[0.06]"
            : "border-emerald-400/20 bg-emerald-500/[0.06]"
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-2.5 w-2.5 rounded-full",
              isPaused ? "bg-amber-400" : "animate-pulse-soft bg-emerald-400"
            )}
          />
          <div>
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-wide",
                isPaused ? "text-amber-400" : "text-emerald-400"
              )}
            >
              {isPaused ? "Stratégie en pause" : "Stratégie active"}
            </p>
            <p className="mt-0.5 font-display text-base font-bold text-white">
              {strategy.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onTogglePause}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-white/70 transition-colors hover:border-white/25 hover:text-white"
          >
            {isPaused ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
            {isPaused ? "Reprendre" : "Mettre en pause"}
          </button>
          <button
            type="button"
            onClick={onStop}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/25 bg-rose-500/[0.08] px-3.5 py-2 text-xs font-semibold text-rose-400 transition-colors hover:border-rose-400/40"
          >
            <Square className="h-3.5 w-3.5" />
            Arrêter
          </button>
        </div>
      </div>

      <RiskDisclaimer />

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Paramètres configurés
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-white/35">Montant max / position</p>
            <p className="mt-0.5 font-semibold text-white">
              {formatEUR(params.maxPositionAmount)}
            </p>
          </div>
          <div>
            <p className="text-white/35">Exposition max</p>
            <p className="mt-0.5 font-semibold text-white">
              {params.maxExposure}%
            </p>
          </div>
          <div>
            <p className="text-white/35">Positions simultanées</p>
            <p className="mt-0.5 font-semibold text-white">
              {params.maxSimultaneousPositions}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Performance depuis l&apos;activation
        </p>
        <p className="mt-1 text-[11px] text-white/30">
          Historique de la stratégie, ne préjuge pas des performances
          futures.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-white/35">Positions copiées</p>
            <p className="mt-0.5 font-semibold text-white">
              {strategy.copiedPositions.length}
            </p>
          </div>
          <div>
            <p className="text-white/35">Résultat cumulé</p>
            <p
              className={cn(
                "mt-0.5 font-semibold",
                totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {formatSignedEUR(totalPnl)}
            </p>
          </div>
          <div>
            <p className="text-white/35">Taux de réussite</p>
            <p className="mt-0.5 font-semibold text-white">
              {closed.length > 0 ? `${winRate}%` : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Positions copiées
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {strategy.copiedPositions.map((position) => (
            <div
              key={position.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <p className="truncate text-sm text-white/85">
                  {position.market}
                </p>
                <span className="flex items-center gap-2 text-[11px] text-white/35">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-bold",
                      position.status === "En cours"
                        ? "bg-white/10 text-white/60"
                        : "bg-white/[0.06] text-white/40"
                    )}
                  >
                    {position.status}
                  </span>
                  {position.date}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="text-sm font-semibold text-white">
                  {formatEUR(position.amount)}
                </span>
                {position.status === "Clôturée" &&
                  position.result !== undefined && (
                    <span
                      className={cn(
                        "text-xs font-bold",
                        position.result >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      )}
                    >
                      {formatSignedEUR(position.result)}
                    </span>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
