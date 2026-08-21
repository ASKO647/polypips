"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CompetitionBadge } from "@/components/dashboard/sports/competition-badge";
import { FlagIcon } from "@/components/dashboard/sports/flag-icon";
import { ACTIVE_SPORT_CATEGORIES, SPORT_EMOJIS } from "@/lib/sports/nav";
import { getCountryCode } from "@/lib/sports/country-codes";
import type { Competition } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

/** Sport picker + real-logo competition list — every SportKey with active
 * real coverage (see nav.ts's SPORT_CATEGORIES comment) shows its own
 * biggest competitions here, each with its real crest via CompetitionBadge
 * rather than a generic icon. */
export function CompetitionsFlow({ competitions }: { competitions: Competition[] }) {
  const [sport, setSport] = useState<string>("all");

  const filtered = useMemo(
    () => (sport === "all" ? competitions : competitions.filter((c) => c.sport === sport)),
    [competitions, sport]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Compétitions
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Toutes les compétitions couvertes par l&apos;analyse Polypips.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSport("all")}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150",
            sport === "all"
              ? "border-brand-400 bg-brand-500/15 text-brand-400"
              : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
          )}
        >
          Tous
        </button>
        {ACTIVE_SPORT_CATEGORIES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSport(s.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150",
              sport === s.key
                ? "border-brand-400 bg-brand-500/15 text-brand-400"
                : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
            )}
          >
            <span aria-hidden>{SPORT_EMOJIS[s.key]}</span>
            {s.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center text-sm text-white/45">
          Aucune compétition disponible pour ce sport pour l&apos;instant.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          {filtered.map((comp) => (
            <Link
              key={comp.id}
              href={`/dashboard/sports/${comp.sport}/${comp.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-3">
                <CompetitionBadge competition={comp} />
                <div>
                  <p className="text-sm font-semibold text-white">{comp.name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-white/40">
                    <FlagIcon code={getCountryCode(comp.country)} className="h-3 w-[18px]" />
                    {comp.country}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/30" strokeWidth={2} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
