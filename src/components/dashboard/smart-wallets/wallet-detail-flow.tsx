"use client";

import { useState } from "react";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { DemoDataBanner } from "@/components/dashboard/smart-wallets/demo-data-banner";
import { SIGNAL_SOURCE_LABELS, type SignalWallet, type SignalWalletTrade } from "@/lib/data/signal-wallets";
import { cn } from "@/lib/utils";

function pnlTone(value: number | null) {
  if (value === null) return "text-white";
  return value >= 0 ? "text-emerald-400" : "text-rose-400";
}

function pnlLabel(value: number | null) {
  if (value === null) return "Donnée indisponible";
  return `${value >= 0 ? "+" : ""}${value.toLocaleString("fr-FR")} $`;
}

function TradeRow({ trade }: { trade: SignalWalletTrade }) {
  const positive = trade.side === "BUY";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={cn("text-xs font-semibold", positive ? "text-emerald-400" : "text-rose-400")}>
          {positive ? "Achat" : "Vente"}
        </span>
        <p className="truncate text-sm text-white/75">{trade.tokenSymbol}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-sm font-bold text-white">{trade.amountUsd.toLocaleString("fr-FR")} $</span>
        <span className="text-[11px] text-white/35">
          {trade.pnl !== null ? `${pnlLabel(trade.pnl)} • ` : ""}
          {trade.tradedAgo}
        </span>
      </div>
    </div>
  );
}

export function WalletDetailFlow({
  wallet,
  trades,
  isFollowed: initialFollowed,
  hasActiveSubscription,
  cancelled,
}: {
  wallet: SignalWallet;
  trades: SignalWalletTrade[];
  isFollowed: boolean;
  hasActiveSubscription: boolean;
  cancelled: boolean;
}) {
  const [isFollowed, setIsFollowed] = useState(initialFollowed);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFollow = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    const next = !isFollowed;
    setIsFollowed(next);
    try {
      const response = await fetch("/api/signal-wallets/follow", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId: wallet.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Une erreur est survenue.");
    } catch (err) {
      setIsFollowed(!next);
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Button href="/dashboard/smart-wallets/suivis" variant="outline" className="w-fit">
        <ArrowLeft className="h-4 w-4" />
        Retour aux Smart Wallets
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold text-white sm:text-2xl">{wallet.label}</h1>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/50">
              {SIGNAL_SOURCE_LABELS[wallet.source]}
            </span>
          </div>
          <p className="mt-1 font-mono text-xs text-white/40">{wallet.address}</p>
          <p className="mt-1 text-xs text-white/35">Repéré {wallet.discoveredAgo}</p>
        </div>
        {wallet.polypipsScore !== null && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/35">
              Score PolyPips
            </p>
            <p className="font-display text-2xl font-bold text-brand-400">{wallet.polypipsScore}/100</p>
          </div>
        )}
      </div>

      {wallet.dataSourceMode === "mock" && <DemoDataBanner />}

      <LockedOverlay
        locked={!hasActiveSubscription}
        cancelled={cancelled}
        message={
          cancelled
            ? "Abonnement annulé — réabonnez-vous pour voir le détail complet de ce Smart Wallet."
            : "Débloquez le détail complet de ce Smart Wallet. Débutez pour 0,99 €"
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "PnL 24h", value: pnlLabel(wallet.pnl24h), tone: pnlTone(wallet.pnl24h) },
            { label: "PnL 7j", value: pnlLabel(wallet.pnl7d), tone: pnlTone(wallet.pnl7d) },
            { label: "PnL 30j", value: pnlLabel(wallet.pnl30d), tone: pnlTone(wallet.pnl30d) },
            {
              label: "Win rate",
              value: wallet.winRate !== null ? `${wallet.winRate}%` : "Donnée indisponible",
              tone: "text-white",
            },
          ].map((tile) => (
            <div key={tile.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/35">
                {tile.label}
              </p>
              <p className={cn("mt-1.5 text-base font-bold", tile.tone)}>{tile.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/35">Trades</p>
            <p className="mt-1.5 text-base font-bold text-white">{wallet.tradesCount ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/35">Drawdown</p>
            <p className="mt-1.5 text-base font-bold text-white">
              {wallet.drawdownPercent !== null ? `${wallet.drawdownPercent}%` : "Donnée indisponible"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/35">
              Temps de détention moyen
            </p>
            <p className="mt-1.5 text-base font-bold text-white">
              {wallet.avgHoldTimeMinutes !== null ? `${wallet.avgHoldTimeMinutes} min` : "—"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleFollow}
          disabled={pending}
          className={cn(
            "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-bold transition-colors duration-150",
            isFollowed
              ? "border-brand-400 bg-brand-500/15 text-brand-400"
              : "border-white/15 bg-white/[0.03] text-white hover:border-white/25"
          )}
        >
          {isFollowed ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isFollowed ? "Wallet suivi" : "Suivre ce Smart Wallet"}
        </button>
        {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
        {isFollowed && (
          <p className="mt-2 text-center text-xs text-white/40">
            Activez le Copy Trading depuis{" "}
            <Link href="/dashboard/smart-wallets/suivis" className="font-semibold text-brand-400 underline underline-offset-2">
              Copy Trading
            </Link>
            .
          </p>
        )}

        {wallet.positions.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 font-display text-sm font-bold text-white">Positions ouvertes</h2>
            <div className="flex flex-col gap-2">
              {wallet.positions.map((p, i) => (
                <div
                  key={`${p.tokenSymbol}-${i}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm"
                >
                  <span className="text-white/80">{p.tokenSymbol}</span>
                  <span className="font-semibold text-white">{p.amountUsd.toLocaleString("fr-FR")} $</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <h2 className="mb-3 font-display text-sm font-bold text-white">Historique des trades</h2>
          {trades.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-white/35">
              Aucun trade détecté pour ce wallet pour le moment.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {trades.map((trade) => (
                <TradeRow key={trade.id} trade={trade} />
              ))}
            </div>
          )}
        </div>
      </LockedOverlay>
    </div>
  );
}
