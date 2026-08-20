import { ShieldAlert, Users } from "lucide-react";
import { SportsEmptyState } from "@/components/dashboard/sports/sports-empty-state";
import { TeamBadge } from "@/components/dashboard/sports/team-badge";
import type { InjuredPlayer, InjuryStatus, Match, ProbableLineup } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

const INJURY_LABEL: Record<InjuryStatus, string> = {
  out: "Blessé",
  doubtful: "Incertain",
  suspended: "Suspendu",
};

function LineupColumn({ team, lineup }: { team: Match["homeTeam"]; lineup: ProbableLineup }) {
  return (
    <div className="flex-1 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <TeamBadge team={team} size="sm" />
          <p className="text-sm font-semibold text-white">{team.shortName}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-white/60">
          {lineup.formation}
        </span>
      </div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/35">
        {lineup.status === "confirmed" ? "Composition confirmée" : "Composition probable"}
      </p>
      <div className="flex flex-col divide-y divide-white/5">
        {lineup.players.map((p) => (
          <div key={p.name} className="flex items-center justify-between py-1.5 text-xs">
            <span className="text-white/80">{p.name}</span>
            <span className="text-white/35">{p.position}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InjuriesColumn({ team, injuries }: { team: Match["homeTeam"]; injuries: InjuredPlayer[] }) {
  return (
    <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="mb-2.5 text-xs font-semibold text-white/60">{team.shortName}</p>
      {injuries.length === 0 ? (
        <p className="text-xs text-white/30">Aucune absence connue.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {injuries.map((p) => (
            <div key={p.name} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-white/80">{p.name}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  p.status === "out"
                    ? "bg-rose-500/15 text-rose-400"
                    : p.status === "suspended"
                      ? "bg-white/10 text-white/50"
                      : "bg-amber-500/15 text-amber-400"
                )}
              >
                {INJURY_LABEL[p.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CompositionsTab({
  match,
  lineups,
  injuries,
}: {
  match: Match;
  lineups: { home: ProbableLineup; away: ProbableLineup } | null;
  injuries: InjuredPlayer[];
}) {
  const homeInjuries = injuries.filter((i) => i.teamId === match.homeTeam.id);
  const awayInjuries = injuries.filter((i) => i.teamId === match.awayTeam.id);

  return (
    <div className="flex flex-col gap-5">
      {lineups === null ? (
        <SportsEmptyState
          icon={Users}
          title="Compositions pas encore disponibles"
          message="Les compositions probables s'afficheront ici dès qu'une source réelle sera connectée — jamais une composition inventée."
        />
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row">
          <LineupColumn team={match.homeTeam} lineup={lineups.home} />
          <LineupColumn team={match.awayTeam} lineup={lineups.away} />
        </div>
      )}

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40">
          <ShieldAlert className="h-3.5 w-3.5" strokeWidth={2} />
          Absents / Incertains
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <InjuriesColumn team={match.homeTeam} injuries={homeInjuries} />
          <InjuriesColumn team={match.awayTeam} injuries={awayInjuries} />
        </div>
      </div>
    </div>
  );
}
