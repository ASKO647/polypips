"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { SportsAnalysisInput } from "@/components/dashboard/sports/ai-analysis/sports-analysis-input";
import { SportsAnalysisLoading } from "@/components/dashboard/sports/ai-analysis/sports-analysis-loading";
import { SportsAnalysisResult } from "@/components/dashboard/sports/ai-analysis/sports-analysis-result";
import {
  sportsAnalysisErrorMessage,
  type SportBetAnalysis,
  type SportsAnalysisProgressStep,
} from "@/lib/data/sports-analysis";
import {
  SportsAnalysisRequestError,
  runSportsBetAnalysis,
  type AnalyzeSportsBetRequest,
} from "@/lib/supabase/analyze-sports-bet-client";

type FlowState = "input" | "loading" | "result";

function errorContentFor(error: unknown): React.ReactNode {
  if (error instanceof SportsAnalysisRequestError && error.code === "limit_reached") {
    return (
      <>
        {error.message}{" "}
        <Link
          href="/dashboard/settings"
          className="font-semibold text-brand-400 underline underline-offset-2 hover:text-brand-300"
        >
          Changer de plan →
        </Link>
      </>
    );
  }
  return sportsAnalysisErrorMessage(
    error instanceof SportsAnalysisRequestError ? error.code : "unknown"
  );
}

/** Sport universe's own "Analyse IA" — replaces "Top opportunités" on the
 * Sports Overview page. Analyzes any real-world sports bet, any bookmaker,
 * submitted by screenshot or manual entry — see analyze-sports-bet's own
 * comment for why this is a separate pipeline from Polymarket's Analyse
 * IA rather than a generalization of it. */
export function SportsAnalysisFlow({ hasActiveSubscription }: { hasActiveSubscription: boolean }) {
  const [state, setState] = useState<FlowState>("input");
  const [result, setResult] = useState<SportBetAnalysis | null>(null);
  const [currentStep, setCurrentStep] = useState<SportsAnalysisProgressStep | null>(null);
  const [errorMessage, setErrorMessage] = useState<React.ReactNode | null>(null);

  const handleAnalyze = async (request: AnalyzeSportsBetRequest) => {
    setErrorMessage(null);
    setCurrentStep(null);
    setState("loading");
    try {
      const analysis = await runSportsBetAnalysis(request, (step) => setCurrentStep(step));
      setResult(analysis);
      setState("result");
    } catch (error) {
      setErrorMessage(errorContentFor(error));
      setState("input");
    }
  };

  const handleNewAnalysis = () => {
    setResult(null);
    setErrorMessage(null);
    setState("input");
  };

  if (state === "loading") {
    return <SportsAnalysisLoading currentStep={currentStep} />;
  }

  if (state === "result" && result) {
    return (
      <SportsAnalysisResult analysis={result} onBack={handleNewAnalysis} locked={!hasActiveSubscription} />
    );
  }

  return <SportsAnalysisInput errorMessage={errorMessage} onAnalyze={handleAnalyze} />;
}
