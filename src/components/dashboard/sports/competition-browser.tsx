"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCountryFlag } from "@/lib/sports/service";
import type { Competition, Country, SportKey } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

export function CompetitionBrowser({
  sport,
  competitions,
  countries,
}: {
  sport: SportKey;
  competitions: Competition[];
  countries: Country[];
}) {
  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return competitions.filter((c) => {
      if (countryFilter && c.country !== countryFilter) return false;
      if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [competitions, query, countryFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un championnat, une équipe..."
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-400"
        />
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">
          Pays populaires
        </h2>
        <div className="flex flex-wrap gap-2">
          {countries.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() =>
                setCountryFilter((prev) => (prev === country.name ? null : country.name))
              }
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
                countryFilter === country.name
                  ? "border-brand-400 bg-brand-500/15 text-brand-400"
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white"
              )}
            >
              <span aria-hidden>{country.flagEmoji}</span>
              {country.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">
          Championnats populaires
        </h2>
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-center text-sm text-white/45">
            Aucun championnat ne correspond à cette recherche.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            {filtered.map((comp) => (
              <Link
                key={comp.id}
                href={`/dashboard/sports/${sport}/${comp.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-white/[0.04]"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{comp.name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-white/40">
                    <span aria-hidden>{getCountryFlag(comp.country)}</span>
                    {comp.country}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/30" strokeWidth={2} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
