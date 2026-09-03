"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TradingChartInput } from "@/components/dashboard/trading/trading-chart-input";
import { TradingAnalysisLoading } from "@/components/dashboard/trading/trading-analysis-loading";
import { TradingAnalysisResult } from "@/components/dashboard/trading/trading-analysis-result";
import {
  TradingAnalysisError,
  runTradingChartAnalysis,
} from "@/lib/supabase/analyze-trading-chart-client";
import {
  tradingErrorMessage,
  type TradingChartAnalysis,
  type TradingProgressStep,
} from "@/lib/data/trading-analysis";

type FlowState = "input" | "loading" | "result";

type TradingTranslator = ReturnType<typeof useTranslations>;

function errorContentFor(error: unknown, t: TradingTranslator): React.ReactNode {
  if (error instanceof TradingAnalysisError && error.code === "limit_reached") {
    return (
      <>
        {error.message}{" "}
        <Link
          href="/dashboard/settings"
          className="font-semibold text-brand-400 underline underline-offset-2 hover:text-brand-300"
        >
          {t("changePlanCta")}
        </Link>
      </>
    );
  }
  return tradingErrorMessage(t, error instanceof TradingAnalysisError ? error.code : "unknown");
}

export function TradingAnalyseIaFlow() {
  const t = useTranslations("Trading");
  const [state, setState] = useState<FlowState>("input");
  const [result, setResult] = useState<TradingChartAnalysis | null>(null);
  const [currentStep, setCurrentStep] = useState<TradingProgressStep | null>(null);
  const [errorMessage, setErrorMessage] = useState<React.ReactNode | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleAnalyze = async (request: { imageBase64: string; imageMediaType: string }) => {
    setErrorMessage(null);
    setCurrentStep(null);
    setState("loading");
    try {
      const analysis = await runTradingChartAnalysis(request, (step) => setCurrentStep(step));
      setResult(analysis);
      setFile(null);
      setState("result");
    } catch (error) {
      setErrorMessage(errorContentFor(error, t));
      setState("input");
    }
  };

  const handleNewAnalysis = () => {
    setResult(null);
    setErrorMessage(null);
    setFile(null);
    setState("input");
  };

  if (state === "loading") {
    return <TradingAnalysisLoading currentStep={currentStep} />;
  }

  if (state === "result" && result) {
    return <TradingAnalysisResult analysis={result} onBack={handleNewAnalysis} />;
  }

  return (
    <TradingChartInput
      errorMessage={errorMessage}
      file={file}
      onFileChange={setFile}
      onAnalyze={handleAnalyze}
    />
  );
}
