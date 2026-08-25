"use client";

import { useMemo, useState } from "react";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { SIGNAL_COPY_STATUS_LABELS, type SignalCopyStatus, type SignalCopyTrade } from "@/lib/data/signal-copy-trading";
import { SIGNAL_SOURCE_LABELS } from "@/lib/data/signal-wallets";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<SignalCopyStatus, string> = {
  detection: "bg-white/[0.06] text-white/50",
  analyse: "bg-sky-500/15 text-sky-400",
  en_attente: "bg-amber-500/15 text-amber-400",
  copie: "bg-emerald-500/15 text-emerald-400",
  ignore: "bg-white/[0.06] text-white/40",
  en_cours: "bg-brand-500/15 text-brand-400",
  ferme: "bg-white/[0.08] text-white/60",
  echec: "bg-rose-500/15 text-rose-400",
};

const STATUS_FILTERS: { value: SignalCopyStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "en_cours", label: "En cours" },
  { value: "copie", label: "Copié" },
  { value: "ignore", label: "Ignoré" },
  { value: "ferme", label: "Fermé" },
];

function TradeRow({ trade }: { trade: SignalCopyTrade }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-sm font-bold text-white">{trade.walletLabel}</p>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/40">
              {SIGNAL_SOURCE_LABELS[trade.walletSource]}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/50">
            {trade.tokenSymbol} • {trade.walletTradeSide === "BUY" ? "Achat" : "Vente"} wallet :{" "}
            {trade.walletTradeAmount.toLocaleString("fr-FR")} $
          </p>
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", STATUS_TONE[trade.status])}>
          {SIGNAL_COPY_STATUS_LABELS[trade.status]}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div>
          <p className="text-white/35">Score IA</p>
          <p className="mt-0.5 font-semibold text-white">{trade.aiScore ?? "—"}/100</p>
        </div>
        <div>
          <p className="text-white/35">Décision</p>
          <p className={cn("mt-0.5 font-semibold", trade.decision === "copie" ? "text-emerald-400" : "text-white/50")}>
            {trade.decision === "copie" ? "Copié" : "Ignoré"}
          </p>
        </div>
        <div>
          <p className="text-white/35">Montant copié (démo)</p>
          <p className="mt-0.5 font-semibold text-white">
            {trade.sizedAmount !== null ? `${trade.sizedAmount.toLocaleString("fr-FR")} $` : "—"}
          </p>
        </div>
        <div>
          <p className="text-white/35">PnL clôturé</p>
          <p
            className={cn(
              "mt-0.5 font-semibold",
              trade.closedPnl === null ? "text-white" : trade.closedPnl >= 0 ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {trade.closedPnl !== null
              ? `${trade.closedPnl >= 0 ? "+" : ""}${trade.closedPnl.toLocaleString("fr-FR")} $`
              : "—"}
          </p>
        </div>
      </div>

      {trade.ignoreReason && (
        <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-white/50">
          {trade.ignoreReason}
        </p>
      )}

      <p className="mt-2 text-[11px] text-white/30">{trade.createdAgo} • mode démo — aucune transaction réelle</p>
    </div>
  );
}

export function PositionsFlow({
  trades,
  hasActiveSubscription,
  cancelled,
}: {
  trades: SignalCopyTrade[];
  hasActiveSubscription: boolean;
  cancelled: boolean;
}) {
  const [status, setStatus] = useState<SignalCopyStatus | "all">("all");
  const filtered = useMemo(
    () => (status === "all" ? trades : trades.filter((t) => t.status === status)),
    [trades, status]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Trades copiés &amp; positions
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Chaque trade détecté sur un Smart Wallet suivi, sa décision (COPY/IGNORE), et le suivi de
          la position simulée jusqu&apos;à sa fermeture. Mode démo — aucune transaction réelle
          n&apos;est exécutée.
        </p>
      </div>

      <LockedOverlay
        locked={!hasActiveSubscription}
        cancelled={cancelled}
        message={
          cancelled
            ? "Abonnement annulé — réabonnez-vous pour voir vos trades copiés."
            : "Débloquez le suivi de vos trades copiés. Débutez pour 0,99 €"
        }
      >
        <div className="mb-4 flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
                status === f.value
                  ? "border-brand-400 bg-brand-500/15 text-brand-400"
                  : "border-white/10 bg-white/[0.02] text-white/55 hover:border-white/20 hover:text-white"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center text-sm text-white/40">
            Aucun trade copié pour le moment — activez le Copy Trading sur un Smart Wallet suivi
            pour commencer à en voir apparaître ici.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((trade) => (
              <TradeRow key={trade.id} trade={trade} />
            ))}
          </div>
        )}
      </LockedOverlay>
    </div>
  );
}
