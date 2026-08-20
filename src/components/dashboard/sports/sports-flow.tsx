"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { MatchCard } from "@/components/dashboard/sports/match-card";
import type { Competition, Match } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

const ALL_COMPETITIONS = "Toutes";

export function SportsFlow({
  matches,
  competitions,
}: {
  matches: Match[];
  competitions: Competition[];
}) {
  const [competitionId, setCompetitionId] = useState<string>(ALL_COMPETITIONS);

  const filtered = useMemo(
    () =>
      competitionId === ALL_COMPETITIONS
        ? matches
        : matches.filter((m) => m.competition.id === competitionId),
    [matches, competitionId]
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Sports
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Football — probabilités, statistiques et analyse IA pour les prochains matchs.
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
            <Trophy className="h-5 w-5" strokeWidth={2} />
          </span>
          <p className="text-sm font-semibold text-white">Aucun match à venir</p>
          <p className="max-w-sm text-xs leading-relaxed text-white/45">
            Revenez un peu plus tard pour voir les prochaines rencontres.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCompetitionId(ALL_COMPETITIONS)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150",
                competitionId === ALL_COMPETITIONS
                  ? "border-brand-400 bg-brand-500/15 text-brand-400"
                  : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
              )}
            >
              {ALL_COMPETITIONS}
            </button>
            {competitions.map((comp) => (
              <button
                key={comp.id}
                type="button"
                onClick={() => setCompetitionId(comp.id)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150",
                  competitionId === comp.id
                    ? "border-brand-400 bg-brand-500/15 text-brand-400"
                    : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
                )}
              >
                {comp.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
