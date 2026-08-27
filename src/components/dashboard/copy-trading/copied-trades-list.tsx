"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { COPIED_TRADE_STATUS_LABELS, type CopiedTradeItem } from "@/lib/data/copied-trades";
import { cn } from "@/lib/utils";

type DecisionFilter = "all" | "copie" | "ignore";

const DECISION_FILTERS: { value: DecisionFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "copie", label: "Copié" },
  { value: "ignore", label: "Ignoré" },
];

function TradeRow({ item, onOpen }: { item: CopiedTradeItem; onOpen: (item: CopiedTradeItem) => void }) {
  const isNew = item.status === "nouvelle";
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors duration-150 hover:border-white/20"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {isNew && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" aria-hidden />}
            <p className="font-display text-sm font-bold text-white">{item.walletLabel}</p>
            {item.walletBadge && (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/40">
                {item.walletBadge}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-white/50">{item.subtitle}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
            item.decision === "copie" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.06] text-white/40"
          )}
        >
          {item.decision === "copie" ? "Copié" : "Ignoré"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
        <div>
          <p className="text-white/35">{item.scoreLabel}</p>
          <p className="mt-0.5 font-semibold text-white">{item.score ?? "—"}/100</p>
        </div>
        <div>
          <p className="text-white/35">{item.amountLabel}</p>
          <p className="mt-0.5 font-semibold text-white">{item.amountValue}</p>
        </div>
        <div>
          <p className="text-white/35">Statut</p>
          <p className="mt-0.5 font-semibold text-white/70">{COPIED_TRADE_STATUS_LABELS[item.status]}</p>
        </div>
      </div>

      {item.ignoreReason && (
        <p className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-white/50">
          {item.ignoreReason}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-white/30">{item.createdAgo}</p>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-400">
          {item.linkLabel}
          <ExternalLink className="h-3 w-3" strokeWidth={2} />
        </span>
      </div>
    </button>
  );
}

/**
 * Generic "Mes trades copiés" list — the row UI, decision filter, empty
 * state, and lock gate are identical across universes; only the data
 * (mapped to CopiedTradeItem by the caller) and the click behavior
 * (persisting to the right table, opening the right external link) differ.
 */
export function CopiedTradesList({
  title,
  description,
  items: initialItems,
  hasActiveSubscription,
  cancelled,
  lockedMessage,
  emptyMessage,
  onOpen,
}: {
  title: string;
  description: string;
  items: CopiedTradeItem[];
  hasActiveSubscription: boolean;
  cancelled: boolean;
  lockedMessage: string;
  emptyMessage: string;
  /** Caller persists the "lien cliqué" status to its own table and opens
   * the relevant external link — this component only handles the
   * optimistic local status flip and the filter/empty-state UI. */
  onOpen: (item: CopiedTradeItem) => void | Promise<void>;
}) {
  const [items, setItems] = useState(initialItems);
  const [decision, setDecision] = useState<DecisionFilter>("all");
  const filtered = useMemo(
    () => (decision === "all" ? items : items.filter((t) => t.decision === decision)),
    [items, decision]
  );

  const handleOpen = async (item: CopiedTradeItem) => {
    if (item.status !== "lien_cliquee") {
      setItems((prev) => prev.map((t) => (t.id === item.id ? { ...t, status: "lien_cliquee" } : t)));
    }
    await onOpen(item);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">{description}</p>
      </div>

      <LockedOverlay locked={!hasActiveSubscription} cancelled={cancelled} message={lockedMessage}>
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
            {emptyMessage}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((item) => (
              <TradeRow key={item.id} item={item} onOpen={handleOpen} />
            ))}
          </div>
        )}
      </LockedOverlay>
    </div>
  );
}
