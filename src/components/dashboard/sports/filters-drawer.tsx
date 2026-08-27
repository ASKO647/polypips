"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { PillSelect } from "@/components/dashboard/sports/pill-select";
import { Button } from "@/components/ui/button";
import { ACTIVE_SPORT_CATEGORIES, SPORT_EMOJIS } from "@/lib/sports/nav";
import type { Competition } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

const DATE_PILLS = ["Aujourd'hui", "Demain", "Cette semaine"] as const;
const MARKET_TYPES = ["Résultat 1X2", "BTTS", "Double chance", "Handicap asiatique", "Total de buts", "Score exact"];
const SORT_OPTIONS = ["Meilleures opportunités", "Confiance décroissante", "Heure du coup d'envoi"];

/** Filters panel shared by the Overview and Opportunités screens. Every
 * control here is fully wired to local state — it's the result COUNT that
 * is honest, not the UI: with no detection pipeline connected yet, any
 * combination of filters resolves to 0 opportunities, and the CTA says so
 * plainly rather than showing a plausible number. */
export function FiltersDrawer({
  open,
  onClose,
  competitions,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  competitions: Competition[];
  resultCount: number;
}) {
  const [competitionId, setCompetitionId] = useState<string>("all");
  const [sport, setSport] = useState<string>("football");
  const [datePill, setDatePill] = useState<string>("Aujourd'hui");
  const [minConfidence, setMinConfidence] = useState(70);
  const [marketTypes, setMarketTypes] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
  const [showAllMarkets, setShowAllMarkets] = useState(false);

  if (!open) return null;

  const toggleMarketType = (m: string) => {
    setMarketTypes((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  const visibleMarketTypes = showAllMarkets ? MARKET_TYPES : MARKET_TYPES.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={onClose} aria-hidden />
      <div className="absolute inset-y-0 right-0 flex w-[340px] max-w-[88vw] animate-fade-up flex-col overflow-y-auto border-l border-white/10 bg-[#160b0c]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <span className="flex items-center gap-2 font-display text-base font-bold text-white">
            <SlidersHorizontal className="h-4 w-4 text-brand-400" strokeWidth={2} />
            Filtres
          </span>
          <button
            type="button"
            aria-label="Fermer les filtres"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-6 px-5 py-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
              Compétitions
            </p>
            <PillSelect
              value={competitionId}
              onChange={setCompetitionId}
              options={[
                { label: "Toutes compétitions", value: "all" },
                ...competitions.map((c) => ({ label: `${c.name} — ${c.country}`, value: c.id })),
              ]}
              triggerClassName="w-full justify-between rounded-xl bg-white/[0.04] px-3 py-2.5 text-sm text-white"
              panelClassName="w-full"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Sports</p>
            <div className="grid grid-cols-4 gap-2">
              {ACTIVE_SPORT_CATEGORIES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSport(s.key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[10px] font-semibold transition-colors duration-150",
                    sport === s.key
                      ? "border-brand-400 bg-brand-500/15 text-brand-400"
                      : "border-white/10 bg-white/[0.03] text-white/55"
                  )}
                >
                  <span className="text-base leading-none" aria-hidden>
                    {SPORT_EMOJIS[s.key]}
                  </span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Date</p>
            <div className="flex flex-wrap gap-2">
              {DATE_PILLS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDatePill(d)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
                    datePill === d
                      ? "border-brand-400 bg-brand-500/15 text-brand-400"
                      : "border-white/10 bg-white/[0.03] text-white/55"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                Confiance minimale
              </p>
              <span className="text-xs font-bold text-white">{minConfidence}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-full accent-brand-500"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
              Types de marchés
            </p>
            <div className="flex flex-col gap-2">
              {visibleMarketTypes.map((m) => (
                <label key={m} className="flex items-center gap-2.5 text-xs text-white/70">
                  <input
                    type="checkbox"
                    checked={marketTypes.has(m)}
                    onChange={() => toggleMarketType(m)}
                    className="h-3.5 w-3.5 accent-brand-500"
                  />
                  {m}
                </label>
              ))}
            </div>
            {!showAllMarkets && MARKET_TYPES.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAllMarkets(true)}
                className="mt-2 text-xs font-semibold text-brand-400 hover:text-brand-300"
              >
                Voir plus
              </button>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Trier par</p>
            <PillSelect
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS.map((o) => ({ label: o, value: o }))}
              triggerClassName="w-full justify-between rounded-xl bg-white/[0.04] px-3 py-2.5 text-sm text-white"
              panelClassName="w-full"
            />
          </div>
        </div>

        <div className="border-t border-white/10 px-5 py-4">
          <Button type="button" onClick={onClose} className="w-full">
            Voir les {resultCount} opportunités
          </Button>
        </div>
      </div>
    </div>
  );
}
