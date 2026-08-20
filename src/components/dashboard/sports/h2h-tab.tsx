"use client";

import { useState } from "react";
import { Swords } from "lucide-react";
import { SportsEmptyState } from "@/components/dashboard/sports/sports-empty-state";
import type { H2HMatch, Match } from "@/lib/sports/types";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
const COLLAPSED_LIMIT = 5;

function summarize(h2h: H2HMatch[], homeName: string) {
  let home = 0;
  let draws = 0;
  let away = 0;
  for (const m of h2h) {
    if (m.homeScore === m.awayScore) {
      draws += 1;
    } else {
      const homeTeamWon = m.homeScore > m.awayScore;
      const winnerIsHome = (homeTeamWon && m.homeTeam === homeName) || (!homeTeamWon && m.awayTeam === homeName);
      if (winnerIsHome) home += 1;
      else away += 1;
    }
  }
  return { home, draws, away };
}

export function H2HTab({ match, h2h }: { match: Match; h2h: H2HMatch[] }) {
  const [expanded, setExpanded] = useState(false);

  if (h2h.length === 0) {
    return (
      <SportsEmptyState
        icon={Swords}
        title="Aucun historique de confrontations"
        message="L'historique des face-à-face entre ces deux équipes s'affichera ici dès qu'une source de résultats réelle sera connectée."
      />
    );
  }

  const summary = summarize(h2h, match.homeTeam.shortName);
  const visible = expanded ? h2h : h2h.slice(0, COLLAPSED_LIMIT);

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="font-display text-xl font-bold text-brand-400">{summary.home}</p>
          <p className="mt-0.5 text-[11px] text-white/45">Victoires {match.homeTeam.shortName}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="font-display text-xl font-bold text-white/60">{summary.draws}</p>
          <p className="mt-0.5 text-[11px] text-white/45">Matchs nuls</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="font-display text-xl font-bold text-sky-400">{summary.away}</p>
          <p className="mt-0.5 text-[11px] text-white/45">Victoires {match.awayTeam.shortName}</p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-white/5">
        {visible.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-xs">
            <span className="text-white/40">{DATE_FORMAT.format(new Date(m.playedAt))}</span>
            <span className="flex-1 truncate px-3 text-center font-medium text-white">
              {m.homeTeam} <span className="font-bold">{m.homeScore}-{m.awayScore}</span> {m.awayTeam}
            </span>
            <span className="text-white/35">{m.competition}</span>
          </div>
        ))}
      </div>

      {h2h.length > COLLAPSED_LIMIT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-semibold text-brand-400 transition-colors hover:text-brand-300"
        >
          {expanded ? "Réduire" : `Voir toutes les confrontations (${h2h.length})`}
        </button>
      )}
    </div>
  );
}
