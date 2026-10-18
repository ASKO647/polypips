"use client";

import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import {
  analysisLoadingStepLabel,
  ANALYSIS_STEP_ORDER,
  type AnalysisProgressStep,
} from "@/lib/data/analysis";
import { cn } from "@/lib/utils";

export function AnalysisLoading({
  currentStep,
}: {
  currentStep: AnalysisProgressStep | null;
}) {
  const t = useTranslations("Polymarket.AnalyseIa");
  const currentIndex = currentStep ? ANALYSIS_STEP_ORDER.indexOf(currentStep) : -1;

  const progress = currentIndex < 0 ? 4 : ((currentIndex + 1) / ANALYSIS_STEP_ORDER.length) * 100;
  return (
    <div className="mx-auto mt-8 flex min-h-[560px] max-w-3xl animate-[fadeIn_.45s_ease-out] flex-col items-center justify-center gap-8 rounded-2xl border border-[#eadfe2] bg-white px-6 py-16 text-[#171014] shadow-[0_18px_60px_rgba(82,21,33,.08)]">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#ffd3da] bg-[#fff0f2]">
        <Loader2 className="h-7 w-7 animate-spin text-[#f3173c]" strokeWidth={2} />
      </span>
      <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-[#f3edef]"><span className="block h-full rounded-full bg-[#f3173c] transition-[width] duration-300" style={{width:`${progress}%`}} /></div>
      <div className="flex w-full max-w-sm flex-col gap-3">
        {ANALYSIS_STEP_ORDER.map((step, i) => {
          const current = i === currentIndex;
          const complete = currentIndex >= 0 && i < currentIndex;
          return (
            <div key={step} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                  complete
                    ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                    : current
                      ? "border-[#f3173c] bg-[#fff0f2] text-[#f3173c]"
                      : "border-[#ddd4d7] text-[#aaa0a4]"
                )}
              >
                {complete ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm transition-colors duration-200",
                  complete && "text-[#8a7f83]",
                  current && "font-medium text-[#171014]",
                  !complete && !current && "text-[#aaa0a4]"
                )}
              >
                {analysisLoadingStepLabel(step, t)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
