"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { ANALYSIS_LOADING_STEPS } from "@/lib/data/analysis";
import { cn } from "@/lib/utils";

const STEP_DURATION_MS = 650;

export function AnalysisLoading({ onComplete }: { onComplete: () => void }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (activeStep >= ANALYSIS_LOADING_STEPS.length) {
      const done = window.setTimeout(onComplete, STEP_DURATION_MS);
      return () => window.clearTimeout(done);
    }
    const timer = window.setTimeout(
      () => setActiveStep((s) => s + 1),
      STEP_DURATION_MS
    );
    return () => window.clearTimeout(timer);
  }, [activeStep, onComplete]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
        <Loader2 className="h-7 w-7 animate-spin text-brand-400" strokeWidth={2} />
      </span>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {ANALYSIS_LOADING_STEPS.map((step, i) => {
          const done = i < activeStep;
          const current = i === activeStep;
          return (
            <div key={step} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                  done
                    ? "border-emerald-400 bg-emerald-400/15 text-emerald-400"
                    : current
                      ? "border-brand-400 bg-brand-400/15 text-brand-400"
                      : "border-white/15 text-white/20"
                )}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm transition-colors duration-200",
                  done && "text-white/40",
                  current && "font-medium text-white",
                  !done && !current && "text-white/25"
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
