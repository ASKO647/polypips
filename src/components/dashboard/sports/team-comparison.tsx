import { TeamBadge } from "@/components/dashboard/sports/team-badge";
import type { Match, TeamComparisonStat } from "@/lib/sports/types";

function ComparisonRow({
  stat,
  homeColor,
  awayColor,
}: {
  stat: TeamComparisonStat;
  homeColor: string;
  awayColor: string;
}) {
  const total = stat.homeValue + stat.awayValue || 1;
  const homeShare = (stat.homeValue / total) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-white">
          {stat.homeValue}
          {stat.unit ?? ""}
        </span>
        <span className="text-white/40">{stat.label}</span>
        <span className="font-semibold text-white">
          {stat.awayValue}
          {stat.unit ?? ""}
        </span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full" style={{ width: `${homeShare}%`, backgroundColor: homeColor }} />
        <div
          className="h-full"
          style={{ width: `${100 - homeShare}%`, backgroundColor: awayColor }}
        />
      </div>
    </div>
  );
}

export function TeamComparisonCard({
  match,
  stats,
}: {
  match: Match;
  stats: TeamComparisonStat[];
}) {
  const homeColor = match.homeTeam.accentColor ?? "var(--color-brand-500)";
  const awayColor = match.awayTeam.accentColor ?? "var(--color-brand-400)";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-white">Comparaison clés</h3>
        <div className="flex items-center gap-3">
          <TeamBadge team={match.homeTeam} size="sm" />
          <TeamBadge team={match.awayTeam} size="sm" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {stats.map((stat) => (
          <ComparisonRow key={stat.label} stat={stat} homeColor={homeColor} awayColor={awayColor} />
        ))}
      </div>
    </div>
  );
}
