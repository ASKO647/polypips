"use client";

import { useState } from "react";
import Link from "next/link";
import { AnalysisInput } from "@/components/dashboard/analyse-ia/analysis-input";
import { AnalysisLoading } from "@/components/dashboard/analyse-ia/analysis-loading";
import { AnalysisResult } from "@/components/dashboard/analyse-ia/analysis-result";
import { analysisErrorMessage, type AnalysisProgressStep, type MarketAnalysis } from "@/lib/data/analysis";
import {
  AnalysisRequestError,
  runMarketAnalysis,
  type AnalyzeMarketRequest,
} from "@/lib/supabase/analyze-market-client";

type FlowState = "input" | "loading" | "result";

function errorContentFor(error: unknown): React.ReactNode {
  if (error instanceof AnalysisRequestError && error.code === "limit_reached") {
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
  return analysisErrorMessage(
    error instanceof AnalysisRequestError ? error.code : "unknown"
  );
}

export function AnalyseIaFlow({
  initialRecentAnalyses,
  hasActiveSubscription,
}: {
  initialRecentAnalyses: MarketAnalysis[];
  hasActiveSubscription: boolean;
}) {
  const [state, setState] = useState<FlowState>("input");
  const [result, setResult] = useState<MarketAnalysis | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState(initialRecentAnalyses);
  const [currentStep, setCurrentStep] = useState<AnalysisProgressStep | null>(null);
  const [errorMessage, setErrorMessage] = useState<React.ReactNode | null>(null);
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleAnalyze = async (request: AnalyzeMarketRequest) => {
    setErrorMessage(null);
    setCurrentStep(null);
    setState("loading");
    try {
      const analysis = await runMarketAnalysis(request, (step) => {
        setCurrentStep(step);
      });
      setResult(analysis);
      setRecentAnalyses((prev) => [analysis, ...prev].slice(0, 5));
      setLink("");
      setFile(null);
      setState("result");
    } catch (error) {
      setErrorMessage(errorContentFor(error));
      setState("input");
    }
  };

  const handleSelectRecent = (analysis: MarketAnalysis) => {
    setResult(analysis);
    setState("result");
  };

  const handleNewAnalysis = () => {
    setResult(null);
    setErrorMessage(null);
    setLink("");
    setFile(null);
    setState("input");
  };

  if (state === "loading") {
    return <AnalysisLoading currentStep={currentStep} />;
  }

  if (state === "result" && result) {
    return (
      <AnalysisResult
        analysis={result}
        onBack={handleNewAnalysis}
        locked={!hasActiveSubscription}
      />
    );
  }

  return (
    <AnalysisInput
      recentAnalyses={recentAnalyses}
      errorMessage={errorMessage}
      link={link}
      onLinkChange={setLink}
      file={file}
      onFileChange={setFile}
      onAnalyze={handleAnalyze}
      onSelectRecent={handleSelectRecent}
    />
  );
}
