import { Activity } from "lucide-react";
import { SportsEmptyState } from "@/components/dashboard/sports/sports-empty-state";
import { TeamBadge } from "@/components/dashboard/sports/team-badge";
import type { H2HMatch, Match, TeamForm } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

const RESULT_STYLE: Record<string, string> = {
  W: "bg-emerald-500/20 text-emerald-400",
  D: "bg-white/10 text-white/50",
  L: "bg-rose-500/20 text-rose-400",
};

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });

function TeamFormColumn({
  team,
  form,
  recent,
}: {
  team: Match["homeTeam"];
  form: TeamForm;
  recent: H2HMatch[];
}) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-2.5">
        <TeamBadge team={team} size="sm" />
        <p className="text-sm font-semibold text-white">{team.shortName}</p>
      </div>

      {form.lastFive.length === 0 ? (
        <span className="text-xs text-white/30">Forme non disponible</span>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {form.lastFive.map((r, i) => (
              <span
                key={i}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                  RESULT_STYLE[r]
                )}
              >
                {r}
              </span>
            ))}
          </div>
          <span className="text-xs text-white/40">
            {form.goalsPerMatch !== null ? `${form.goalsPerMatch} buts/match` : "—"}
          </span>
        </div>
      )}

      <div className="flex flex-col divide-y divide-white/5 border-t border-white/5 pt-2">
        {recent.length === 0 ? (
          <p className="py-3 text-xs text-white/30">Aucun match récent disponible.</p>
        ) : (
          recent.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 py-2 text-xs">
              <span className="truncate text-white/60">
                {DATE_FORMAT.format(new Date(m.playedAt))} · {m.homeTeam === team.shortName ? m.awayTeam : m.homeTeam}
              </span>
              <span className="font-semibold text-white">
                {m.homeScore}-{m.awayScore}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function FormeTab({
  match,
  form,
  recentResults,
}: {
  match: Match;
  form: { home: TeamForm; away: TeamForm };
  recentResults: { home: H2HMatch[]; away: H2HMatch[] };
}) {
  const hasAnyData =
    form.home.lastFive.length > 0 || form.away.lastFive.length > 0 ||
    recentResults.home.length > 0 || recentResults.away.length > 0;

  if (!hasAnyData) {
    return (
      <SportsEmptyState
        icon={Activity}
        title="Forme pas encore disponible"
        message="Les 5 derniers résultats et matchs récents de chaque équipe s'afficheront ici dès qu'une source de résultats réelle sera connectée."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <TeamFormColumn team={match.homeTeam} form={form.home} recent={recentResults.home} />
      <TeamFormColumn team={match.awayTeam} form={form.away} recent={recentResults.away} />
    </div>
  );
}
