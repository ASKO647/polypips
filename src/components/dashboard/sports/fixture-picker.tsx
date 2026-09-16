"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft, BrainCircuit, Calendar, Info } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import type { Sport, SportFixture, SportSearchResult } from "@/lib/sports/types";
import type { AnalysisDepth } from "@/lib/data/deep-analysis";

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
  creditBalance,
  onSelect,
}: {
  fixture: SportFixture;
  creditBalance: number;
  onSelect: (depth: AnalysisDepth) => void;
}) {
  const t = useTranslations("Sport.FixturePicker");
  const tCredits = useTranslations("Credits");
  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 transition-colors duration-150 hover:border-brand-400/50 hover:bg-brand-500/5">
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          size="sm"
          onClick={() => onSelect("standard")}
          className="w-full sm:w-auto"
        >
          {t("analyzeCta")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSelect("deep")}
          className="w-full sm:w-auto"
        >
          <BrainCircuit className="h-3.5 w-3.5" />
          {tCredits("DeepAnalysis.button")}
          <span className="ml-0.5 text-[11px] font-normal text-current opacity-60">
            ({tCredits("DeepAnalysis.buttonCreditCost")} · {creditBalance})
          </span>
        </Button>
      </div>
    </div>
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
  creditBalance,
  onSelectFixture,
  onBack,
}: {
  sport: Sport;
  result: SportSearchResult;
  creditBalance: number;
  onSelectFixture: (fixture: SportFixture, depth: AnalysisDepth) => void;
  onBack: () => void;
}) {
  const t = useTranslations("Sport.FixturePicker");
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
          {t("newSearch")}
        </Button>
      </div>

      <div>
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-white/40">
          {t("upcomingTitle")}
        </p>
        {result.upcomingFixtures.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-white/35">
            {t("noUpcoming", { type: isTennis ? "tennis" : "team" })}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {result.upcomingFixtures.map((fixture) => (
              <FixtureCard
                key={fixture.externalFixtureId}
                fixture={fixture}
                creditBalance={creditBalance}
                onSelect={(depth) => onSelectFixture(fixture, depth)}
              />
            ))}
          </div>
        )}
        {isTennis && (
          <p className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-white/35">
            <Info className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2} />
            {t("tennisDrawNotice")}
          </p>
        )}
      </div>

      {isTennis ? (
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-white/35">
          <Info className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2} />
          {t("tennisNoHistory")}
        </p>
      ) : (
        result.recentMeetings.length > 0 && (
          <div>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-white/40">
              {t("recentMeetingsTitle")}
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
