"use client";

import { ArrowLeft, Calendar, Info } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import type { Sport, SportFixture, SportSearchResult } from "@/lib/sports/types";

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function FixtureCard({
  fixture,
  onSelect,
}: {
  fixture: SportFixture;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-left transition-colors duration-150 hover:border-brand-400/50 hover:bg-brand-500/5"
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-brand-400">
        <Calendar className="h-3.5 w-3.5" strokeWidth={2.25} />
        {DATE_FORMATTER.format(new Date(fixture.kickoffAt))}
      </div>
      <p className="text-sm font-semibold text-white">
        {fixture.homeTeamName} <span className="text-white/30">vs</span> {fixture.awayTeamName}
      </p>
      {fixture.competitionName && (
        <p className="text-xs text-white/40">{fixture.competitionName}</p>
      )}
    </button>
  );
}

function RecentMeetingRow({ meeting }: { meeting: SportFixture }) {
  const score =
    meeting.homeScore !== null && meeting.awayScore !== null
      ? `${meeting.homeScore} - ${meeting.awayScore}`
      : "—";
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-xs">
      <span className="text-white/60">
        {meeting.homeTeamName} <span className="text-white/30">vs</span> {meeting.awayTeamName}
      </span>
      <div className="flex shrink-0 items-center gap-3">
        <span className="font-semibold text-white">{score}</span>
        <span className="text-white/35">{SHORT_DATE_FORMATTER.format(new Date(meeting.kickoffAt))}</span>
      </div>
    </div>
  );
}

export function FixturePicker({
  sport,
  result,
  onSelectFixture,
  onBack,
}: {
  sport: Sport;
  result: SportSearchResult;
  onSelectFixture: (fixture: SportFixture) => void;
  onBack: () => void;
}) {
  const isTennis = sport === "tennis";

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">
          {result.team1.name} <span className="text-white/30">vs</span> {result.team2.name}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          <ButtonIcon variant="outline">
            <ArrowLeft className="h-3.5 w-3.5" />
          </ButtonIcon>
          Nouvelle recherche
        </Button>
      </div>

      <div>
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-white/40">
          Prochaines confrontations — choisissez celle à analyser
        </p>
        {result.upcomingFixtures.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-white/35">
            Aucune confrontation à venir trouvée entre ces deux {isTennis ? "joueurs" : "équipes"}.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {result.upcomingFixtures.map((fixture) => (
              <FixtureCard
                key={fixture.externalFixtureId}
                fixture={fixture}
                onSelect={() => onSelectFixture(fixture)}
              />
            ))}
          </div>
        )}
        {isTennis && (
          <p className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-white/35">
            <Info className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2} />
            Au tennis, une rencontre n&apos;apparaît qu&apos;une fois le tableau du tournoi publié
            (généralement 1 à 3 jours avant) — un duel à venir peut donc ne pas encore être visible
            ici même s&apos;il aura bien lieu.
          </p>
        )}
      </div>

      {isTennis ? (
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-white/35">
          <Info className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2} />
          Historique des confrontations non disponible pour le tennis — la source de données ne
          couvre pas les résultats passés pour ce sport.
        </p>
      ) : (
        result.recentMeetings.length > 0 && (
          <div>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-white/40">
              Confrontations récentes
            </p>
            <div className="flex flex-col gap-2">
              {result.recentMeetings.map((meeting) => (
                <RecentMeetingRow key={meeting.externalFixtureId} meeting={meeting} />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
