import { UserX } from "lucide-react";
import { TeamBadge } from "@/components/dashboard/sports/team-badge";
import type { InjuredPlayer, Match } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

function TeamInjuries({
  team,
  injuries,
}: {
  team: Match["homeTeam"];
  injuries: InjuredPlayer[];
}) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-2">
        <TeamBadge team={team} size="sm" />
        <p className="text-sm font-semibold text-white">{team.shortName}</p>
      </div>
      {injuries.length === 0 ? (
        <p className="text-xs text-white/40">Aucune absence connue.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {injuries.map((player) => (
            <li key={player.name} className="flex items-start justify-between gap-3 text-xs">
              <div>
                <p className="font-medium text-white">{player.name}</p>
                <p className="mt-0.5 text-white/40">{player.reason}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                  player.status === "out"
                    ? "bg-rose-500/15 text-rose-400"
                    : "bg-amber-500/15 text-amber-400"
                )}
              >
                {player.status === "out" ? "Absent" : "Incertain"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function InjuriesView({
  match,
  injuries,
}: {
  match: Match;
  injuries: InjuredPlayer[];
}) {
  if (injuries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
        <UserX className="h-5 w-5 text-white/30" strokeWidth={2} />
        <p className="text-sm text-white/40">Aucune absence connue pour ce match.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <TeamInjuries
        team={match.homeTeam}
        injuries={injuries.filter((i) => i.teamId === match.homeTeam.id)}
      />
      <TeamInjuries
        team={match.awayTeam}
        injuries={injuries.filter((i) => i.teamId === match.awayTeam.id)}
      />
    </div>
  );
}
