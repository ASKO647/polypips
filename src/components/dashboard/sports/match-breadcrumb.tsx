import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CompetitionBadge } from "@/components/dashboard/sports/competition-badge";
import { FlagIcon } from "@/components/dashboard/sports/flag-icon";
import { getSportCategory } from "@/lib/sports/nav";
import { getCountryCode } from "@/lib/sports/service";
import type { Match } from "@/lib/sports/types";

export function MatchBreadcrumb({ match }: { match: Match }) {
  const sportLabel = getSportCategory(match.sport)?.label ?? match.sport;
  const countryCode = getCountryCode(match.competition.country);
  const crumbs = [
    { label: "Sports", href: "/dashboard/sports" },
    { label: sportLabel, href: `/dashboard/sports/${match.sport}` },
    {
      label: match.competition.country,
      icon: <FlagIcon code={countryCode} className="h-3 w-[18px]" />,
    },
    {
      label: match.competition.name,
      href: `/dashboard/sports/${match.sport}/${match.competition.id}`,
      icon: <CompetitionBadge competition={match.competition} size="sm" />,
    },
    { label: `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}` },
  ];

  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs text-white/40">
      {crumbs.map((crumb, i) => (
        <span key={crumb.label} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3 w-3" strokeWidth={2} />}
          {crumb.href ? (
            <Link href={crumb.href} className="flex items-center gap-1.5 transition-colors hover:text-white/70">
              {crumb.icon}
              {crumb.label}
            </Link>
          ) : (
            <span
              className={`flex items-center gap-1.5 ${i === crumbs.length - 1 ? "text-white/60" : ""}`}
            >
              {crumb.icon}
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
