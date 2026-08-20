import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getSportCategory } from "@/lib/sports/nav";
import { getCountryFlag } from "@/lib/sports/service";
import type { Match } from "@/lib/sports/types";

export function MatchBreadcrumb({ match }: { match: Match }) {
  const sportLabel = getSportCategory(match.sport)?.label ?? match.sport;
  const countryFlag = getCountryFlag(match.competition.country);
  const crumbs = [
    { label: "Sports", href: "/dashboard/sports" },
    { label: sportLabel, href: `/dashboard/sports/${match.sport}` },
    { label: `${countryFlag ? `${countryFlag} ` : ""}${match.competition.country}` },
    { label: match.competition.name, href: `/dashboard/sports/${match.sport}/${match.competition.id}` },
    { label: `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}` },
  ];

  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs text-white/40">
      {crumbs.map((crumb, i) => (
        <span key={crumb.label} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3 w-3" strokeWidth={2} />}
          {crumb.href ? (
            <Link href={crumb.href} className="transition-colors hover:text-white/70">
              {crumb.label}
            </Link>
          ) : (
            <span className={i === crumbs.length - 1 ? "text-white/60" : undefined}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
