import { TeamBadge } from "@/components/dashboard/sports/team-badge";
import type { Match, ProbableLineup } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

function LineupColumn({
  team,
  lineup,
}: {
  team: Match["homeTeam"];
  lineup: ProbableLineup;
}) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TeamBadge team={team} size="sm" />
          <p className="text-sm font-semibold text-white">{team.shortName}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold",
            lineup.status === "confirmed"
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-white/[0.08] text-white/50"
          )}
        >
          {lineup.status === "confirmed" ? "Confirmée" : "Probable"} · {lineup.formation}
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {lineup.players.map((player) => (
          <li key={player.name} className="flex items-center justify-between text-xs">
            <span className="text-white/70">{player.name}</span>
            <span className="text-white/35">{player.position}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LineupsView({
  match,
  lineups,
}: {
  match: Match;
  lineups: { home: ProbableLineup; away: ProbableLineup } | null;
}) {
  if (!lineups) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center text-sm text-white/40">
        Compositions probables non disponibles pour le moment.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <LineupColumn team={match.homeTeam} lineup={lineups.home} />
      <LineupColumn team={match.awayTeam} lineup={lineups.away} />
    </div>
  );
}
