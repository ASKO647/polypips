import { TeamBadge } from "@/components/dashboard/sports/team-badge";
import type { FormResult, Match, TeamForm as TeamFormType } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

const RESULT_LABEL: Record<FormResult, string> = { W: "V", D: "N", L: "D" };
const RESULT_CLASSES: Record<FormResult, string> = {
  W: "bg-emerald-500/20 text-emerald-400",
  D: "bg-white/[0.08] text-white/50",
  L: "bg-rose-500/20 text-rose-400",
};

function FormRow({ team, form }: { team: Match["homeTeam"]; form: TeamFormType }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <TeamBadge team={team} size="sm" />
        <p className="text-sm font-medium text-white">{team.shortName}</p>
      </div>
      <div className="flex gap-1">
        {form.lastFive.map((result, i) => (
          <span
            key={i}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold",
              RESULT_CLASSES[result]
            )}
          >
            {RESULT_LABEL[result]}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TeamFormCard({
  match,
  home,
  away,
}: {
  match: Match;
  home: TeamFormType;
  away: TeamFormType;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="font-display text-sm font-semibold text-white">Forme récente</h3>
      <div className="flex flex-col gap-3">
        <FormRow team={match.homeTeam} form={home} />
        <FormRow team={match.awayTeam} form={away} />
      </div>
    </div>
  );
}
