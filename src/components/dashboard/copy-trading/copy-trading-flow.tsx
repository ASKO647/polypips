"use client";

import { useState } from "react";
import { RiskDisclaimer } from "@/components/dashboard/copy-trading/risk-disclaimer";
import { StrategyActive } from "@/components/dashboard/copy-trading/strategy-active";
import { StrategyCard } from "@/components/dashboard/copy-trading/strategy-card";
import { StrategyConfigForm } from "@/components/dashboard/copy-trading/strategy-config-form";
import {
  MOCK_STRATEGIES,
  type RiskParameters,
  type Strategy,
} from "@/lib/data/copy-trading";

type FlowState = "list" | "configure" | "active";

export function CopyTradingFlow() {
  const [state, setState] = useState<FlowState>("list");
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(
    null
  );
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);
  const [activeParams, setActiveParams] = useState<RiskParameters | null>(
    null
  );
  const [isPaused, setIsPaused] = useState(false);

  const handleConfigure = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setState("configure");
  };

  const handleActivate = (params: RiskParameters) => {
    if (!selectedStrategy) return;
    setActiveStrategy(selectedStrategy);
    setActiveParams(params);
    setIsPaused(false);
    setState("active");
  };

  const handleStop = () => {
    setActiveStrategy(null);
    setActiveParams(null);
    setIsPaused(false);
    setState("list");
  };

  if (state === "configure" && selectedStrategy) {
    return (
      <StrategyConfigForm
        strategy={selectedStrategy}
        onCancel={() => setState("list")}
        onActivate={handleActivate}
      />
    );
  }

  if (state === "active" && activeStrategy && activeParams) {
    return (
      <StrategyActive
        strategy={activeStrategy}
        params={activeParams}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((v) => !v)}
        onStop={handleStop}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Copy Trading
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Copiez automatiquement les stratégies des traders et portefeuilles
          Smart Money les plus suivis sur Polypips.
        </p>
      </div>

      <RiskDisclaimer />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_STRATEGIES.map((strategy) => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            onConfigure={() => handleConfigure(strategy)}
          />
        ))}
      </div>
    </div>
  );
}
