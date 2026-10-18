"use client";

import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import {
  TRADING_STEP_ORDER,
  getTradingLoadingSteps,
  type TradingProgressStep,
} from "@/lib/data/trading-analysis";
import { cn } from "@/lib/utils";
import styles from "./trading-analysis.module.css";

export function TradingAnalysisLoading({ currentStep }: { currentStep: TradingProgressStep | null }) {
  const t = useTranslations("Trading");
  const loadingSteps = getTradingLoadingSteps(t);
  const currentIndex = currentStep ? TRADING_STEP_ORDER.indexOf(currentStep) : -1;

  return (
    <main className={styles.loadingPage}>
      <span className={styles.loadingIcon}>
        <Loader2 className="h-7 w-7 animate-spin" strokeWidth={2} />
      </span>
      <h1>Analyse du graphique en cours…</h1>
      <p>Polypips lit votre graphique et prépare une synthèse structurée.</p>
      <div className={styles.loadingSteps}>
        {TRADING_STEP_ORDER.map((step, i) => {
          const current = i === currentIndex;
          const complete = currentIndex >= 0 && i < currentIndex;
          return (
            <div key={step}>
              <span
                className={cn(
                  styles.loadingDot,
                  complete
                    ? styles.loadingComplete
                    : current
                      ? styles.loadingCurrent
                      : styles.loadingPending
                )}
              >
                {complete ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              <span>
                {loadingSteps[step]}
              </span>
            </div>
          );
        })}
      </div>
    </main>
  );
}
