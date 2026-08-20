"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { TeamBadge } from "@/components/dashboard/sports/team-badge";
import type { Match } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

const KICKOFF_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

function TeamFavoriteStar({ label }: { label: string }) {
  const [active, setActive] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setActive((v) => !v)}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
        active
          ? "border-brand-400/50 bg-brand-500/15 text-brand-400"
          : "border-white/10 bg-white/[0.04] text-white/40 hover:text-white"
      )}
    >
      <Star className={cn("h-4 w-4", active && "fill-current")} strokeWidth={2} />
    </button>
  );
}

const STATUS_LABEL: Record<Match["status"], string> = {
  scheduled: "À venir",
  live: "En direct",
  finished: "Terminé",
};

export function MatchHeader({ match }: { match: Match }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center sm:p-8">
      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/60">
        {match.competition.name}
      </span>

      <div className="flex w-full items-center justify-center gap-4 sm:gap-10">
        <div className="flex flex-1 flex-col items-center gap-3 sm:flex-row sm:justify-end">
          <TeamFavoriteStar label={`Ajouter ${match.homeTeam.shortName} aux favoris`} />
          <TeamBadge team={match.homeTeam} size="lg" />
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="font-display text-xl font-bold text-white sm:text-2xl">
            {match.homeTeam.shortName}
            <span className="mx-2 text-white/30">vs</span>
            {match.awayTeam.shortName}
          </p>
        </div>

        <div className="flex flex-1 flex-col items-center gap-3 sm:flex-row sm:justify-start">
          <TeamBadge team={match.awayTeam} size="lg" />
          <TeamFavoriteStar label={`Ajouter ${match.awayTeam.shortName} aux favoris`} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/60">
          {KICKOFF_FORMAT.format(new Date(match.kickoffAt))}
        </span>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            match.status === "live"
              ? "bg-brand-500/15 text-brand-400"
              : "bg-white/[0.06] text-white/50"
          )}
        >
          {STATUS_LABEL[match.status]}
        </span>
      </div>
    </div>
  );
}
