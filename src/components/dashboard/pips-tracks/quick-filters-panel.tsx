"use client";

import { Info, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuickFilters = {
  tokenSymbol: string;
  minAmount: number;
  minScore: "all" | "eleve" | "moyen" | "faible";
  followedOnly: boolean;
  keyword: string;
};

export const DEFAULT_QUICK_FILTERS: QuickFilters = {
  tokenSymbol: "all",
  minAmount: 0,
  minScore: "all",
  followedOnly: false,
  keyword: "",
};

const AMOUNT_OPTIONS = [
  { value: 0, label: "Tous les montants" },
  { value: 1000, label: "≥ 1 000 $" },
  { value: 5000, label: "≥ 5 000 $" },
  { value: 10000, label: "≥ 10 000 $" },
  { value: 50000, label: "≥ 50 000 $" },
];

const SCORE_OPTIONS: { value: QuickFilters["minScore"]; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "eleve", label: "Élevé" },
  { value: "moyen", label: "Moyen" },
  { value: "faible", label: "Faible" },
];

export function QuickFiltersPanel({
  filters,
  onChange,
  availableTokens,
  hasFollowedWallets,
}: {
  filters: QuickFilters;
  onChange: (filters: QuickFilters) => void;
  /** Distinct token symbols across the currently loaded feed page — quick
   * filters apply client-side to what's already loaded (see
   * pips-tracks-flow.tsx's own comment), so this dropdown mirrors that
   * same scope rather than querying the whole table. */
  availableTokens: string[];
  hasFollowedWallets: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-1.5">
        <h2 className="text-sm font-bold text-white">Filtres rapides</h2>
        <Info className="h-3.5 w-3.5 text-white/30" strokeWidth={2} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-white/40">Tokens</label>
        <select
          value={filters.tokenSymbol}
          onChange={(e) => onChange({ ...filters, tokenSymbol: e.target.value })}
          className="w-full rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-semibold text-white/70 outline-none focus:border-brand-400"
        >
          <option value="all" className="bg-[#1a0e0f]">
            Tous les tokens
          </option>
          {availableTokens.map((symbol) => (
            <option key={symbol} value={symbol} className="bg-[#1a0e0f]">
              ${symbol}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-white/40">Montant minimum</label>
        <select
          value={filters.minAmount}
          onChange={(e) => onChange({ ...filters, minAmount: Number(e.target.value) })}
          className="w-full rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-semibold text-white/70 outline-none focus:border-brand-400"
        >
          {AMOUNT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#1a0e0f]">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-white/40">Score IA minimum</label>
        <div className="flex flex-wrap gap-1.5">
          {SCORE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...filters, minScore: opt.value })}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors duration-150",
                filters.minScore === opt.value
                  ? "border-brand-400 bg-brand-500/15 text-brand-400"
                  : "border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <label
        className={cn(
          "flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5",
          !hasFollowedWallets && "opacity-50"
        )}
      >
        <div>
          <p className="text-xs font-semibold text-white/80">Wallets suivis</p>
          <p className="mt-0.5 text-[11px] text-white/40">Afficher uniquement les wallets suivis</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={filters.followedOnly}
          disabled={!hasFollowedWallets}
          onClick={() => onChange({ ...filters, followedOnly: !filters.followedOnly })}
          className={cn(
            "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed",
            filters.followedOnly ? "bg-brand-500" : "bg-white/15"
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
              filters.followedOnly && "translate-x-4"
            )}
          />
        </button>
      </label>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-white/40">Mots-clés</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
            placeholder="Rechercher un mot-clé..."
            className="w-full rounded-full border border-white/10 bg-white/[0.02] py-2 pl-8 pr-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-brand-400"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(DEFAULT_QUICK_FILTERS)}
        className="rounded-full border border-white/10 py-2 text-xs font-semibold text-white/60 transition-colors hover:border-white/25 hover:text-white"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}
