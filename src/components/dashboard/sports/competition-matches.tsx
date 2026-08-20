"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CalendarX } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { TeamBadge } from "@/components/dashboard/sports/team-badge";
import { Button } from "@/components/ui/button";
import { getCountryFlag } from "@/lib/sports/service";
import type { Competition, Match, SportKey } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

type Window = "all" | "today" | "tomorrow" | "week";

const WINDOW_PILLS: { key: Window; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "today", label: "Aujourd'hui" },
  { key: "tomorrow", label: "Demain" },
  { key: "week", label: "Cette semaine" },
];

const TIME_FORMAT = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const DAY_FORMAT = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "2-digit", month: "long" });

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayLabel(date: Date): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(date, now)) return "Aujourd'hui";
  if (isSameDay(date, tomorrow)) return "Demain";
  return DAY_FORMAT.format(date);
}

export function CompetitionMatches({
  sport,
  competition,
  matches,
}: {
  sport: SportKey;
  competition: Competition;
  matches: Match[];
}) {
  const [window, setWindow] = useState<Window>("all");

  const filtered = useMemo(() => {
    if (window === "all") return matches;
    const now = new Date();
    if (window === "today") return matches.filter((m) => isSameDay(new Date(m.kickoffAt), now));
    if (window === "tomorrow") {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return matches.filter((m) => isSameDay(new Date(m.kickoffAt), tomorrow));
    }
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return matches.filter((m) => new Date(m.kickoffAt) <= weekEnd);
  }, [matches, window]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Match[]>();
    for (const match of filtered) {
      const label = dayLabel(new Date(match.kickoffAt));
      const list = groups.get(label) ?? [];
      list.push(match);
      groups.set(label, list);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/dashboard/sports/${sport}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Retour aux championnats
        </Link>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {competition.name}
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/45">
          <span aria-hidden>{getCountryFlag(competition.country)}</span>
          {competition.country}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {WINDOW_PILLS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setWindow(p.key)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150",
              window === p.key
                ? "border-brand-400 bg-brand-500/15 text-brand-400"
                : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05]">
            <CalendarX className="h-5 w-5 text-white/30" strokeWidth={2} />
          </span>
          <p className="text-sm font-semibold text-white">Aucun match disponible</p>
          <p className="max-w-xs text-xs leading-relaxed text-white/45">
            Aucun match de {competition.name} n&apos;est actuellement disponible à l&apos;analyse.
          </p>
          <Button href={`/dashboard/sports/${sport}`} variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Retour aux championnats
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(([label, dayMatches]) => (
            <div key={label}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
                {label}
              </p>
              <div className="flex flex-col divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                {dayMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-12 shrink-0 text-xs font-semibold text-white/50">
                        {TIME_FORMAT.format(new Date(match.kickoffAt))}
                      </span>
                      <TeamBadge team={match.homeTeam} size="sm" />
                      <span className="text-sm font-semibold text-white">
                        {match.homeTeam.shortName}
                      </span>
                      <span className="text-xs font-bold uppercase text-white/30">vs</span>
                      <TeamBadge team={match.awayTeam} size="sm" />
                      <span className="text-sm font-semibold text-white">
                        {match.awayTeam.shortName}
                      </span>
                    </div>
                    <Button href={`/dashboard/sports/match/${match.id}`} size="sm">
                      Analyser
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
