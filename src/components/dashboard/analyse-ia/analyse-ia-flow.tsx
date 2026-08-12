"use client";

import { useState } from "react";
import { AnalysisInput } from "@/components/dashboard/analyse-ia/analysis-input";
import { AnalysisLoading } from "@/components/dashboard/analyse-ia/analysis-loading";
import { AnalysisResult } from "@/components/dashboard/analyse-ia/analysis-result";
import { NEW_ANALYSIS_RESULT, type MarketAnalysis } from "@/lib/data/analysis";

type FlowState = "input" | "loading" | "result";

export function AnalyseIaFlow() {
  const [state, setState] = useState<FlowState>("input");
  const [result, setResult] = useState<MarketAnalysis | null>(null);

  const handleLoadingComplete = () => {
    setResult(NEW_ANALYSIS_RESULT);
    setState("result");
  };

  const handleSelectRecent = (analysis: MarketAnalysis) => {
    setResult(analysis);
    setState("result");
  };

  const handleNewAnalysis = () => {
    setResult(null);
    setState("input");
  };

  if (state === "loading") {
    return <AnalysisLoading onComplete={handleLoadingComplete} />;
  }

  if (state === "result" && result) {
    return (
      <AnalysisResult analysis={result} onNewAnalysis={handleNewAnalysis} />
    );
  }

  return (
    <AnalysisInput
      onAnalyze={() => setState("loading")}
      onSelectRecent={handleSelectRecent}
    />
  );
}
