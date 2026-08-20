import { Activity } from "lucide-react";
import { TeamBadge } from "@/components/dashboard/sports/team-badge";
import type { Match, TeamForm } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

const RESULT_STYLE: Record<string, string> = {
  W: "bg-emerald-500/20 text-emerald-400",
  D: "bg-white/10 text-white/50",
  L: "bg-rose-500/20 text-rose-400",
};

function FormRow({ label, form }: { label: string; form: TeamForm }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="truncate text-xs font-semibold text-white/70">{label}</span>
      <div className="flex items-center gap-2">
        {form.lastFive.length === 0 ? (
          <span className="text-[11px] text-white/30">—</span>
        ) : (
          <div className="flex gap-1">
            {form.lastFive.map((r, i) => (
              <span
                key={i}
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold",
                  RESULT_STYLE[r]
                )}
              >
                {r}
              </span>
            ))}
          </div>
        )}
        <span className="text-[11px] text-white/35">
          {form.goalsPerMatch !== null ? `${form.goalsPerMatch} buts/match` : "—"}
        </span>
      </div>
    </div>
  );
}

export function FormPanel({ match, home, away }: { match: Match; home: TeamForm; away: TeamForm }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
        <Activity className="h-4 w-4 text-white/50" strokeWidth={2} />
        Forme récente
      </h3>
      <div className="flex items-center gap-2">
        <TeamBadge team={match.homeTeam} size="sm" />
        <div className="flex-1">
          <FormRow label={match.homeTeam.shortName} form={home} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <TeamBadge team={match.awayTeam} size="sm" />
        <div className="flex-1">
          <FormRow label={match.awayTeam.shortName} form={away} />
        </div>
      </div>
    </div>
  );
}
