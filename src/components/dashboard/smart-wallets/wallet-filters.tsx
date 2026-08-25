"use client";

import { Search } from "lucide-react";
import { SIGNAL_WIN_RATE_FILTERS, type SignalSource, type SignalWalletSort, type SignalWinRateFilter } from "@/lib/data/signal-wallets";
import { cn } from "@/lib/utils";

type SourceFilter = "all" | SignalSource;

const SOURCE_OPTIONS: { value: SourceFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "fomo", label: "Fomo" },
  { value: "axiom", label: "Axiom" },
];

const SORT_OPTIONS: { value: SignalWalletSort; label: string }[] = [
  { value: "score", label: "Score PolyPips" },
  { value: "winRate", label: "Win rate" },
  { value: "pnl", label: "PnL 7j" },
  { value: "activity", label: "Activité" },
];

export function WalletFilters({
  source,
  onSourceChange,
  winRate,
  onWinRateChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
}: {
  source: SourceFilter;
  onSourceChange: (value: SourceFilter) => void;
  winRate: SignalWinRateFilter;
  onWinRateChange: (value: SignalWinRateFilter) => void;
  sort: SignalWalletSort;
  onSortChange: (value: SignalWalletSort) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {SOURCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSourceChange(opt.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
                source === opt.value
                  ? "border-brand-400 bg-brand-500/15 text-brand-400"
                  : "border-white/10 bg-white/[0.02] text-white/55 hover:border-white/20 hover:text-white"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un wallet..."
            className="w-full rounded-full border border-white/10 bg-white/[0.02] py-2 pl-8 pr-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-brand-400"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-white/30">
            Win rate
          </span>
          {SIGNAL_WIN_RATE_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onWinRateChange(opt.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors duration-150",
                winRate === opt.value
                  ? "border-emerald-400 bg-emerald-500/15 text-emerald-400"
                  : "border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SignalWalletSort)}
          className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[11px] font-semibold text-white/70 outline-none focus:border-brand-400"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#1a0e0f]">
              Trier : {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
