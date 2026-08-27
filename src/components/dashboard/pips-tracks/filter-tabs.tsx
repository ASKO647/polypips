"use client";

import { Settings2 } from "lucide-react";
import { PIPS_TRACK_FILTER_TABS, type PipsTrackFilterValue } from "@/lib/data/pips-tracks";
import { cn } from "@/lib/utils";

export function FilterTabs({
  value,
  onChange,
}: {
  value: PipsTrackFilterValue;
  onChange: (value: PipsTrackFilterValue) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-1.5">
        {PIPS_TRACK_FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150",
              value === tab.value
                ? "border-brand-400 bg-brand-500/15 text-brand-400"
                : "border-white/10 bg-white/[0.02] text-white/55 hover:border-white/20 hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* No saved-filter-preferences storage exists yet (Phase 2) — shown
       * disabled rather than wired to a no-op, per the "never imply
       * functionality that doesn't exist" rule. */}
      <button
        type="button"
        disabled
        title="Bientôt disponible"
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/30"
      >
        <Settings2 className="h-3.5 w-3.5" strokeWidth={2} />
        Personnaliser
      </button>
    </div>
  );
}
