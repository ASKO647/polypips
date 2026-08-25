"use client";

import { useState } from "react";
import { AnalyseIaFlow } from "@/components/dashboard/analyse-ia/analyse-ia-flow";
import { SignalAnalysisFlow } from "@/components/dashboard/smart-wallets/signal-analysis/signal-analysis-flow";
import type { MarketAnalysis } from "@/lib/data/analysis";
import { cn } from "@/lib/utils";

type Tab = "polymarket" | "fomo" | "axiom";

const TABS: { value: Tab; label: string }[] = [
  { value: "polymarket", label: "Polymarket" },
  { value: "fomo", label: "Fomo" },
  { value: "axiom", label: "Axiom" },
];

/** Extends the existing Analyse IA page with two new tabs (Fomo/Axiom)
 * without touching AnalyseIaFlow itself — the Polymarket tab renders it
 * completely unchanged, same props as before this component existed. */
export function AnalyseIaTabs({
  initialRecentAnalyses,
  hasActiveSubscription,
}: {
  initialRecentAnalyses: MarketAnalysis[];
  hasActiveSubscription: boolean;
}) {
  const [tab, setTab] = useState<Tab>("polymarket");

  return (
    <div className="flex flex-col gap-6">
      <div className="inline-flex w-fit items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-150",
              tab === t.value ? "bg-brand-500/15 text-brand-400" : "text-white/50 hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "polymarket" && (
        <AnalyseIaFlow
          initialRecentAnalyses={initialRecentAnalyses}
          hasActiveSubscription={hasActiveSubscription}
        />
      )}
      {tab === "fomo" && (
        <SignalAnalysisFlow source="fomo" hasActiveSubscription={hasActiveSubscription} />
      )}
      {tab === "axiom" && (
        <SignalAnalysisFlow source="axiom" hasActiveSubscription={hasActiveSubscription} />
      )}
    </div>
  );
}
