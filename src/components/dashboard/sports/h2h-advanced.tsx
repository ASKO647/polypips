import type { H2HMatch, Match } from "@/lib/sports/types";

/**
 * Aggregates computed directly from the same h2h list H2HListCard renders
 * — genuinely derived numbers, not a second invented dataset, which is
 * what actually distinguishes this "H2H avancé" tab from the plain
 * "Face à face" list rather than just repeating it.
 */
function summarize(h2h: H2HMatch[], homeShortName: string) {
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let totalGoals = 0;

  for (const m of h2h) {
    totalGoals += m.homeScore + m.awayScore;
    const homeTeamScore = m.homeTeam === homeShortName ? m.homeScore : m.awayScore;
    const awayTeamScore = m.homeTeam === homeShortName ? m.awayScore : m.homeScore;
    if (homeTeamScore > awayTeamScore) homeWins += 1;
    else if (homeTeamScore < awayTeamScore) awayWins += 1;
    else draws += 1;
  }

  return {
    homeWins,
    draws,
    awayWins,
    avgGoalsPerMatch: h2h.length > 0 ? totalGoals / h2h.length : 0,
  };
}

export function H2HAdvancedCard({ match, h2h }: { match: Match; h2h: H2HMatch[] }) {
  if (h2h.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center text-sm text-white/40">
        Pas assez de confrontations directes pour une analyse avancée.
      </div>
    );
  }

  const summary = summarize(h2h, match.homeTeam.shortName);

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="font-display text-sm font-semibold text-white">
        H2H avancé — {h2h.length} confrontations analysées
      </h3>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <p className="font-display text-xl font-bold text-white">{summary.homeWins}</p>
          <p className="mt-1 text-[11px] text-white/40">Victoires {match.homeTeam.shortName}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <p className="font-display text-xl font-bold text-white">{summary.draws}</p>
          <p className="mt-1 text-[11px] text-white/40">Nuls</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <p className="font-display text-xl font-bold text-white">{summary.awayWins}</p>
          <p className="mt-1 text-[11px] text-white/40">Victoires {match.awayTeam.shortName}</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <span className="text-xs text-white/50">Moyenne de buts par confrontation</span>
        <span className="font-display text-lg font-bold text-white">
          {summary.avgGoalsPerMatch.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
