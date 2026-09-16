"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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

function errorContentFor(
  error: unknown,
  t: (key: string) => string,
  tCredits: (key: string) => string
): React.ReactNode {
  if (error instanceof AnalysisRequestError && error.code === "no_credits") {
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
  if (error instanceof AnalysisRequestError && error.code === "limit_reached") {
    return (
      <>
        {error.message}{" "}
        <Link
          href="/dashboard/settings"
          className="font-semibold text-brand-400 underline underline-offset-2 hover:text-brand-300"
        >
          {t("changePlanLink")}
        </Link>
      </>
    );
  }
  return analysisErrorMessage(
    error instanceof AnalysisRequestError ? error.code : "unknown",
    t
  );
}

export function AnalyseIaFlow({
  initialRecentAnalyses,
  hasActiveSubscription,
  creditBalance,
}: {
  initialRecentAnalyses: MarketAnalysis[];
  hasActiveSubscription: boolean;
  creditBalance: number;
}) {
  const t = useTranslations("Polymarket.AnalyseIa");
  const tCredits = useTranslations("Credits");
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
      setErrorMessage(errorContentFor(error, t, tCredits));
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
      creditBalance={creditBalance}
    />
  );
}
