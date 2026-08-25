"use client";

import { ArrowRight, Check, Plus } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { SIGNAL_SOURCE_LABELS, type SignalWallet } from "@/lib/data/signal-wallets";
import { cn } from "@/lib/utils";

function riskLabel(level: SignalWallet["riskLevel"]): string {
  if (level === "low") return "Faible";
  if (level === "high") return "Élevé";
  if (level === "medium") return "Moyen";
  return "—";
}

export function WalletCard({
  wallet,
  isFollowed,
  onToggleFollow,
  onViewDetail,
}: {
  wallet: SignalWallet;
  isFollowed: boolean;
  onToggleFollow: () => void;
  onViewDetail: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-base font-bold text-white">{wallet.label}</p>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/40">
              {SIGNAL_SOURCE_LABELS[wallet.source]}
            </span>
          </div>
          <p className="mt-1 font-mono text-xs text-white/40">{wallet.shortAddress}</p>
        </div>
        {wallet.polypipsScore !== null && (
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/35">Score</p>
            <p className="text-lg font-bold text-brand-400">{wallet.polypipsScore}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-white/35">Win rate</p>
          <p className="mt-0.5 font-semibold text-white">
            {wallet.winRate !== null ? `${wallet.winRate}%` : "Donnée indisponible"}
          </p>
        </div>
        <div>
          <p className="text-white/35">PnL 7j</p>
          <p
            className={cn(
              "mt-0.5 font-semibold",
              wallet.pnl7d === null ? "text-white" : wallet.pnl7d >= 0 ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {wallet.pnl7d === null
              ? "Donnée indisponible"
              : `${wallet.pnl7d >= 0 ? "+" : ""}${wallet.pnl7d.toLocaleString("fr-FR")} $`}
          </p>
        </div>
        <div>
          <p className="text-white/35">Trades</p>
          <p className="mt-0.5 font-semibold text-white">{wallet.tradesCount ?? "—"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-white/35">
          Risque : <span className="font-semibold text-white/70">{riskLabel(wallet.riskLevel)}</span>
        </span>
        {wallet.dataSourceMode === "mock" && (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-300">Démo</span>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onToggleFollow}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors duration-150",
            isFollowed
              ? "border-brand-400 bg-brand-500/15 text-brand-400"
              : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white"
          )}
        >
          {isFollowed ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {isFollowed ? "Suivi" : "Suivre"}
        </button>
        <Button type="button" variant="outline" onClick={onViewDetail} className="flex-1">
          Voir le wallet
          <ButtonIcon variant="outline">
            <ArrowRight className="h-4 w-4" />
          </ButtonIcon>
        </Button>
      </div>
    </div>
  );
}
