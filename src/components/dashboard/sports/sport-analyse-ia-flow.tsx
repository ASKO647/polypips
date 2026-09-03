"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SportMatchSearchPanel } from "@/components/dashboard/sports/sport-match-search-panel";
import { FixturePicker } from "@/components/dashboard/sports/fixture-picker";
import { SportMatchLoading } from "@/components/dashboard/sports/sport-match-loading";
import { SportMatchResult } from "@/components/dashboard/sports/sport-match-result";
import {
  SportMatchSearchError,
  searchSportMatch,
} from "@/lib/supabase/sport-match-search-client";
import {
  SportMatchAnalysisError,
  runSportMatchAnalysis,
} from "@/lib/supabase/analyze-sport-match-client";
import {
  sportMatchErrorMessage,
  type SportMatchAnalysis,
  type SportMatchProgressStep,
} from "@/lib/data/sports-analysis";
import type { Sport, SportFixture, SportSearchResult } from "@/lib/sports/types";

type FlowState = "search" | "fixtures" | "loading" | "result";

function errorContentFor(error: unknown, changePlanLabel: string): React.ReactNode {
  if (error instanceof SportMatchAnalysisError && error.code === "limit_reached") {
    return (
      <>
        {error.message}{" "}
        <Link
          href="/dashboard/settings"
          className="font-semibold text-brand-400 underline underline-offset-2 hover:text-brand-300"
        >
          {changePlanLabel}
        </Link>
      </>
    );
  }
  if (error instanceof SportMatchSearchError || error instanceof SportMatchAnalysisError) {
    return error.message;
  }
  return sportMatchErrorMessage("unknown");
}

export function SportAnalyseIaFlow() {
  const t = useTranslations("Sport.Flow");
  const [state, setState] = useState<FlowState>("search");
  const [sport, setSport] = useState<Sport>("football");
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SportSearchResult | null>(null);
  const [result, setResult] = useState<SportMatchAnalysis | null>(null);
  const [currentStep, setCurrentStep] = useState<SportMatchProgressStep | null>(null);
  const [errorMessage, setErrorMessage] = useState<React.ReactNode | null>(null);

  const handleSearch = async () => {
    setErrorMessage(null);
    setSearchLoading(true);
    try {
      const found = await searchSportMatch(sport, team1, team2);
      setSearchResult(found);
      setState("fixtures");
    } catch (error) {
      setErrorMessage(errorContentFor(error, t("changePlan")));
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectFixture = async (fixture: SportFixture) => {
    if (!searchResult) return;
    setErrorMessage(null);
    setCurrentStep(null);
    setState("loading");
    try {
      const analysis = await runSportMatchAnalysis(
        {
          sport,
          homeTeamName: fixture.homeTeamName,
          awayTeamName: fixture.awayTeamName,
          competitionName: fixture.competitionName,
          kickoffAt: fixture.kickoffAt,
          recentMeetings: searchResult.recentMeetings,
        },
        (step) => setCurrentStep(step)
      );
      setResult(analysis);
      setState("result");
    } catch (error) {
      setErrorMessage(errorContentFor(error, t("changePlan")));
      setState("fixtures");
    }
  };

  const handleNewSearch = () => {
    setSearchResult(null);
    setResult(null);
    setErrorMessage(null);
    setTeam1("");
    setTeam2("");
    setState("search");
  };

  const handleBackToFixtures = () => {
    setResult(null);
    setErrorMessage(null);
    setState(searchResult ? "fixtures" : "search");
  };

  if (state === "loading") {
    return <SportMatchLoading currentStep={currentStep} />;
  }

  if (state === "result" && result) {
    return (
      <SportMatchResult analysis={result} onBack={handleBackToFixtures} backLabel={t("otherMatch")} />
    );
  }

  if (state === "fixtures" && searchResult) {
    return (
      <>
        {errorMessage && (
          <p className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-400">
            {errorMessage}
          </p>
        )}
        <FixturePicker
          sport={sport}
          result={searchResult}
          onSelectFixture={handleSelectFixture}
          onBack={handleNewSearch}
        />
      </>
    );
  }

  return (
    <SportMatchSearchPanel
      sport={sport}
      onSportChange={setSport}
      team1={team1}
      onTeam1Change={setTeam1}
      team2={team2}
      onTeam2Change={setTeam2}
      loading={searchLoading}
      errorMessage={typeof errorMessage === "string" ? errorMessage : null}
      onSearch={handleSearch}
    />
  );
}
