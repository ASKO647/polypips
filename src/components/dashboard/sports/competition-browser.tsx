"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CompetitionBadge } from "@/components/dashboard/sports/competition-badge";
import { FlagIcon } from "@/components/dashboard/sports/flag-icon";
import { getCountryCode } from "@/lib/sports/country-codes";
import { circuitEmoji } from "@/lib/sports/nav";
import type { Competition, SportKey } from "@/lib/sports/types";

/**
 * Sport → Pays → Compétition, in that order — one section per group, each
 * listing that group's real competitions (from listCompetitionsByCountry).
 * For team sports the group is a real country (sports_competitions_cache);
 * for individual-athlete sports (tennis/boxing/MMA, odds_api_competitions_
 * cache) there's no country, so the group is the circuit instead (ATP/WTA/
 * ITF/Boxe/MMA) — circuitEmoji() renders a matching badge there instead of
 * attempting a flag. A competition with zero near-term fixtures still
 * shows up here (this list never filters on fixture presence); its own
 * page is what renders the honest "Aucun match disponible" state — see
 * competition-matches.tsx.
 */
export function CompetitionBrowser({
  sport,
  groups,
}: {
  sport: SportKey;
  groups: { country: string; competitions: Competition[] }[];
}) {
  const [query, setQuery] = useState("");

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.country.localeCompare(b.country)),
    [groups]
  );

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return sortedGroups;
    const q = query.toLowerCase();
    return sortedGroups
      .map((group) => ({
        ...group,
        competitions: group.competitions.filter((c) => c.name.toLowerCase().includes(q)),
      }))
      .filter((group) => group.competitions.length > 0);
  }, [sortedGroups, query]);

  const totalCompetitions = groups.reduce((sum, g) => sum + g.competitions.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un championnat..."
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-400"
        />
      </div>

      {totalCompetitions === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center text-sm text-white/45">
          Aucune compétition disponible pour ce sport pour l&apos;instant.
        </p>
      ) : filteredGroups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-center text-sm text-white/45">
          Aucun championnat ne correspond à cette recherche.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredGroups.map((group) => (
            <div key={group.country}>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40">
                {circuitEmoji(group.country) ? (
                  <span aria-hidden>{circuitEmoji(group.country)}</span>
                ) : (
                  <FlagIcon code={getCountryCode(group.country)} className="h-3.5 w-5" />
                )}
                {group.country}
                <span className="text-white/25">— {group.competitions.length}</span>
              </h2>
              <div className="flex flex-col divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                {group.competitions.map((comp) => (
                  <Link
                    key={comp.id}
                    href={`/dashboard/sports/${sport}/${comp.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-3">
                      <CompetitionBadge competition={comp} />
                      <p className="text-sm font-semibold text-white">{comp.name}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/30" strokeWidth={2} />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
