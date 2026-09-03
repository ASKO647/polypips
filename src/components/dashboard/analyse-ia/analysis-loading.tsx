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

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
        <Loader2 className="h-7 w-7 animate-spin text-brand-400" strokeWidth={2} />
      </span>

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
                    ? "border-emerald-400 bg-emerald-400/15 text-emerald-400"
                    : current
                      ? "border-brand-400 bg-brand-400/15 text-brand-400"
                      : "border-white/15 text-white/20"
                )}
              >
                {complete ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm transition-colors duration-200",
                  complete && "text-white/40",
                  current && "font-medium text-white",
                  !complete && !current && "text-white/25"
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
