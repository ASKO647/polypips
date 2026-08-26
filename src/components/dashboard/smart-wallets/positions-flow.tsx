"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { createClient } from "@/lib/supabase/client";
import { SIGNAL_COPY_STATUS_LABELS, type SignalCopyTrade } from "@/lib/data/signal-copy-trading";
import { SIGNAL_SOURCE_LABELS } from "@/lib/data/signal-wallets";
import { cn } from "@/lib/utils";

/** Mirrors sync-signal-wallets/index.ts's own buildPlatformUrl() exactly
 * — that Edge Function (Deno) and this frontend (Next.js) don't share a
 * module, so this trivial mapping is duplicated rather than imported.
 * Update both together if a confirmed per-token URL format ever replaces
 * the homepage fallback. */
function platformUrl(source: "fomo" | "axiom"): string {
  return source === "axiom" ? "https://axiom.trade" : "https://fomo.family";
}

type DecisionFilter = "all" | "copie" | "ignore";

const DECISION_FILTERS: { value: DecisionFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "copie", label: "Copié" },
  { value: "ignore", label: "Ignoré" },
];

function TradeRow({ trade, onOpen }: { trade: SignalCopyTrade; onOpen: (trade: SignalCopyTrade) => void }) {
  const isNew = trade.status === "nouvelle";
  return (
    <button
      type="button"
      onClick={() => onOpen(trade)}
      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors duration-150 hover:border-white/20"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {isNew && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" aria-hidden />}
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
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
            trade.decision === "copie" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.06] text-white/40"
          )}
        >
          {trade.decision === "copie" ? "Copié" : "Ignoré"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
        <div>
          <p className="text-white/35">Score IA</p>
          <p className="mt-0.5 font-semibold text-white">{trade.aiScore ?? "—"}/100</p>
        </div>
        <div>
          <p className="text-white/35">Montant estimé</p>
          <p className="mt-0.5 font-semibold text-white">
            {trade.sizedAmount !== null ? `${trade.sizedAmount.toLocaleString("fr-FR")} $` : "—"}
          </p>
        </div>
        <div>
          <p className="text-white/35">Statut</p>
          <p className="mt-0.5 font-semibold text-white/70">{SIGNAL_COPY_STATUS_LABELS[trade.status]}</p>
        </div>
      </div>

      {trade.ignoreReason && (
        <p className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-white/50">
          {trade.ignoreReason}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-white/30">{trade.createdAgo}</p>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-400">
          Voir sur {SIGNAL_SOURCE_LABELS[trade.walletSource]}
          <ExternalLink className="h-3 w-3" strokeWidth={2} />
        </span>
      </div>
    </button>
  );
}

export function PositionsFlow({
  trades: initialTrades,
  hasActiveSubscription,
  cancelled,
}: {
  trades: SignalCopyTrade[];
  hasActiveSubscription: boolean;
  cancelled: boolean;
}) {
  const [trades, setTrades] = useState(initialTrades);
  const [decision, setDecision] = useState<DecisionFilter>("all");
  const filtered = useMemo(
    () => (decision === "all" ? trades : trades.filter((t) => t.decision === decision)),
    [trades, decision]
  );

  const handleOpen = async (trade: SignalCopyTrade) => {
    if (trade.status !== "lien_cliquee") {
      setTrades((prev) => prev.map((t) => (t.id === trade.id ? { ...t, status: "lien_cliquee" } : t)));
      const supabase = createClient();
      await supabase.from("signal_copy_trades").update({ status: "lien_cliquee" }).eq("id", trade.id);
    }
    window.open(platformUrl(trade.walletSource), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Mes trades copiés
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Chaque trade détecté sur un Smart Wallet suivi et sa décision (copié ou ignoré selon vos
          filtres de risque). PolyPips ne trade jamais à votre place — cliquez une ligne pour ouvrir
          la plateforme concernée et décider vous-même.
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
          {DECISION_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setDecision(f.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
                decision === f.value
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
              <TradeRow key={trade.id} trade={trade} onOpen={handleOpen} />
            ))}
          </div>
        )}
      </LockedOverlay>
    </div>
  );
}
