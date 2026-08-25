"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { SignalAnalysisInput } from "@/components/dashboard/smart-wallets/signal-analysis/signal-analysis-input";
import { SignalAnalysisLoading } from "@/components/dashboard/smart-wallets/signal-analysis/signal-analysis-loading";
import { SignalAnalysisResult } from "@/components/dashboard/smart-wallets/signal-analysis/signal-analysis-result";
import {
  signalAnalysisErrorMessage,
  type SignalAnalysis,
  type SignalAnalysisProgressStep,
} from "@/lib/data/signal-analysis";
import {
  SignalAnalysisRequestError,
  runSignalBetAnalysis,
  type AnalyzeSignalBetRequest,
} from "@/lib/supabase/analyze-signal-client";

type FlowState = "input" | "loading" | "result";

function errorContentFor(error: unknown): React.ReactNode {
  if (error instanceof SignalAnalysisRequestError && error.code === "limit_reached") {
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
  return signalAnalysisErrorMessage(
    error instanceof SignalAnalysisRequestError ? error.code : "unknown"
  );
}

/** Smart Wallets universe's own "Analyse IA" (Fomo/Axiom) — a distinct
 * feature from Polymarket's Analyse IA (AnalyseIaFlow, untouched) and from
 * Sport's (SportsAnalysisFlow, untouched). `source` selects which tab this
 * instance represents; the parent AnalyseIaTabs renders one per tab. */
export function SignalAnalysisFlow({
  source,
  hasActiveSubscription,
}: {
  source: "fomo" | "axiom";
  hasActiveSubscription: boolean;
}) {
  const [state, setState] = useState<FlowState>("input");
  const [result, setResult] = useState<SignalAnalysis | null>(null);
  const [currentStep, setCurrentStep] = useState<SignalAnalysisProgressStep | null>(null);
  const [errorMessage, setErrorMessage] = useState<React.ReactNode | null>(null);

  const handleAnalyze = async (request: AnalyzeSignalBetRequest) => {
    setErrorMessage(null);
    setCurrentStep(null);
    setState("loading");
    try {
      const analysis = await runSignalBetAnalysis(request, (step) => setCurrentStep(step));
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
    return <SignalAnalysisLoading currentStep={currentStep} />;
  }

  if (state === "result" && result) {
    return (
      <SignalAnalysisResult analysis={result} onBack={handleNewAnalysis} locked={!hasActiveSubscription} />
    );
  }

  return <SignalAnalysisInput source={source} errorMessage={errorMessage} onAnalyze={handleAnalyze} />;
}
