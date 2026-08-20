import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { TeamBadge } from "@/components/dashboard/sports/team-badge";
import type { Match } from "@/lib/sports/types";

const KICKOFF_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function MatchCard({ match }: { match: Match }) {
  return (
    <Link
      href={`/dashboard/sports/match/${match.id}`}
      className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors duration-150 hover:border-white/20"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/60">
          {match.competition.name}
        </span>
        <span className="text-xs font-medium text-white/40">
          {KICKOFF_FORMAT.format(new Date(match.kickoffAt))}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 flex-col items-center gap-2">
          <TeamBadge team={match.homeTeam} />
          <p className="text-center text-sm font-semibold text-white">
            {match.homeTeam.shortName}
          </p>
        </div>
        <span className="text-xs font-bold uppercase tracking-wide text-white/30">vs</span>
        <div className="flex flex-1 flex-col items-center gap-2">
          <TeamBadge team={match.awayTeam} />
          <p className="text-center text-sm font-semibold text-white">
            {match.awayTeam.shortName}
          </p>
        </div>
      </div>

      <span className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-white/70 transition-colors group-hover:border-brand-400/50 group-hover:text-white">
        Voir l&apos;analyse
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
