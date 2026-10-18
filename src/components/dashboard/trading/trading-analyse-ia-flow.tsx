"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DashboardChrome } from "@/components/dashboard/shared/dashboard-chrome";
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
import type { AnalysisDepth } from "@/lib/data/deep-analysis";

type FlowState = "input" | "loading" | "result";

type TradingTranslator = ReturnType<typeof useTranslations>;

function errorContentFor(
  error: unknown,
  t: TradingTranslator,
  tCredits: TradingTranslator
): React.ReactNode {
  if (error instanceof TradingAnalysisError && error.code === "no_credits") {
    return (
      <>
        {tCredits("DeepAnalysis.noCreditsMessage")}{" "}
        <Link
          href="/dashboard/credits"
          className="font-semibold text-brand-400 underline underline-offset-2 hover:text-brand-300"
        >
          {tCredits("DeepAnalysis.buyCreditsCta")}
        </Link>
      </>
    );
  }
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

export function TradingAnalyseIaFlow({ creditBalance }: { creditBalance: number }) {
  const locale = useLocale();
  const title = locale === "fr" ? "Analyse IA Trading" : "Trading AI Analysis";
  const t = useTranslations("Trading");
  const tCredits = useTranslations("Credits");
  const [state, setState] = useState<FlowState>("input");
  const [result, setResult] = useState<TradingChartAnalysis | null>(null);
  const [currentStep, setCurrentStep] = useState<TradingProgressStep | null>(null);
  const [errorMessage, setErrorMessage] = useState<React.ReactNode | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleAnalyze = async (
    request: { imageBase64: string; imageMediaType: string },
    depth: AnalysisDepth
  ) => {
    setErrorMessage(null);
    setCurrentStep(null);
    setState("loading");
    try {
      const analysis = await runTradingChartAnalysis({ ...request, depth }, (step) =>
        setCurrentStep(step)
      );
      setResult(analysis);
      setFile(null);
      setState("result");
    } catch (error) {
      setErrorMessage(errorContentFor(error, t, tCredits));
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
    return <DashboardChrome title={title}><TradingAnalysisLoading currentStep={currentStep} /></DashboardChrome>;
  }

  if (state === "result" && result) {
    return <DashboardChrome title={title}><main className="min-h-screen bg-white p-5 sm:p-8"><TradingAnalysisResult analysis={result} onBack={handleNewAnalysis} /></main></DashboardChrome>;
  }

  return (
    <DashboardChrome title={title}>
      <TradingChartInput
        creditBalance={creditBalance}
        errorMessage={errorMessage}
        file={file}
        onFileChange={setFile}
        onAnalyze={handleAnalyze}
      />
    </DashboardChrome>
  );
}
