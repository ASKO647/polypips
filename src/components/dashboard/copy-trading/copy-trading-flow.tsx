"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HelpCircle, Users } from "lucide-react";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { RiskDisclaimer } from "@/components/dashboard/copy-trading/risk-disclaimer";
import { StrategyActive } from "@/components/dashboard/copy-trading/strategy-active";
import { StrategyCard } from "@/components/dashboard/copy-trading/strategy-card";
import { StrategyConfigForm } from "@/components/dashboard/copy-trading/strategy-config-form";
import { TutorialModal } from "@/components/dashboard/copy-trading/tutorial-modal";
import type { RiskParameters, Strategy, Suggestion } from "@/lib/data/copy-trading";
import { cn, formatResetDate } from "@/lib/utils";

type FlowState = "list" | "configure" | "active";

const TUTORIAL_SEEN_KEY = "polypips-copy-trading-tutorial-seen";

export function CopyTradingFlow({
  strategies: initialStrategies,
  suggestionsByStrategyId,
  hasActiveSubscription,
  cancelled,
  maxActiveStrategies,
  quotaLocked,
  quotaResetDate,
}: {
  strategies: Strategy[];
  suggestionsByStrategyId: Record<string, Suggestion[]>;
  hasActiveSubscription: boolean;
  /** True when access is blocked because the user cancelled — swaps the
   * "Débutez pour 0,99 €" first-time CTA for a "réabonnez-vous" one. */
  cancelled: boolean;
  maxActiveStrategies: number | null;
  /** True once the user has activated maxActiveStrategies strategies in
   * the current billing cycle — activating, pausing, and stopping are all
   * blocked until the subscription renews. Always false now: both plans
   * are unlimited on this quota (maxActiveStrategies === null). */
  quotaLocked: boolean;
  quotaResetDate: string | null;
}) {
  const [strategies, setStrategies] = useState(initialStrategies);
  const suggestions = suggestionsByStrategyId;
  const [state, setState] = useState<FlowState>("list");
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(TUTORIAL_SEEN_KEY)) {
      // First-visit read from localStorage — an SSR-safe initializer can't
      // see this, so it has to happen post-mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowTutorial(true);
    }
  }, []);

  const closeTutorial = () => {
    window.localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
    setShowTutorial(false);
  };

  const selectedStrategy = selectedWalletId
    ? (strategies.find((s) => s.walletId === selectedWalletId) ?? null)
    : null;

  const activeCount = strategies.filter((s) => s.status === "active").length;

  const lockMessage = quotaLocked
    ? `Vous avez atteint votre limite mensuelle (${activeCount}/${maxActiveStrategies} stratégies actives). Passez à un plan supérieur pour en activer davantage${
        quotaResetDate ? `, ou attendez le renouvellement le ${formatResetDate(quotaResetDate)}` : ""
      }.`
    : null;

  const handleActivate = async (params: RiskParameters) => {
    if (!selectedStrategy) return;
    if (quotaLocked) throw new Error(lockMessage ?? "Sélection verrouillée pour ce cycle.");
    setError(null);

    const response = await fetch("/api/copy-trading/strategies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletId: selectedStrategy.walletId, ...params }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Impossible d'activer cette stratégie.");
    }

    setStrategies((prev) =>
      prev.map((s) =>
        s.walletId === selectedStrategy.walletId
          ? { ...s, strategyId: data.strategyId, status: "active", riskParameters: params }
          : s
      )
    );
    setState("active");
  };

  const handleTogglePause = async () => {
    if (!selectedStrategy?.strategyId) return;
    if (quotaLocked) {
      setError(lockMessage);
      return;
    }
    const nextStatus = selectedStrategy.status === "active" ? "paused" : "active";

    const response = await fetch(
      `/api/copy-trading/strategies/${selectedStrategy.strategyId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Une erreur est survenue.");
      return;
    }

    setStrategies((prev) =>
      prev.map((s) =>
        s.walletId === selectedStrategy.walletId ? { ...s, status: nextStatus } : s
      )
    );
  };

  const handleStop = async () => {
    if (!selectedStrategy?.strategyId) return;
    if (quotaLocked) {
      setError(lockMessage);
      return;
    }

    const response = await fetch(
      `/api/copy-trading/strategies/${selectedStrategy.strategyId}`,
      { method: "DELETE" }
    );
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Une erreur est survenue.");
      return;
    }

    setStrategies((prev) =>
      prev.map((s) =>
        s.walletId === selectedStrategy.walletId
          ? { ...s, strategyId: null, status: null, riskParameters: null }
          : s
      )
    );
    setState("list");
    setSelectedWalletId(null);
  };

  // "configure" is only reachable by clicking a StrategyCard's button, which
  // sits inside the LockedOverlay below and is non-interactive once locked
  // — so a subscription-less viewer can never land here through the UI.
  // Not wrapped in its own LockedOverlay because that would also disable
  // StrategyConfigForm's own Cancel button, trapping the user on this
  // screen with no way back.
  if (state === "configure" && selectedStrategy) {
    return (
      <StrategyConfigForm
        strategy={selectedStrategy}
        onCancel={() => setState("list")}
        onActivate={handleActivate}
      />
    );
  }

  if (state === "active" && selectedStrategy && selectedStrategy.riskParameters) {
    return (
      <>
        <StrategyActive
          strategy={selectedStrategy}
          params={selectedStrategy.riskParameters}
          suggestions={suggestions[selectedStrategy.strategyId ?? ""] ?? []}
          isPaused={selectedStrategy.status === "paused"}
          onTogglePause={handleTogglePause}
          onStop={handleStop}
          locked={!hasActiveSubscription}
          quotaLocked={quotaLocked}
          quotaLockMessage={lockMessage}
        />
        {error && (
          <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-4 py-3 text-xs text-rose-300">
            {error}
          </p>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {showTutorial && <TutorialModal onClose={closeTutorial} />}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Copy Trading
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
            Recevez une notification quand un portefeuille Smart Money que
            vous suivez fait un mouvement — libre à vous de le répliquer sur
            Polymarket.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTutorial(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-white/60 transition-colors hover:border-white/25 hover:text-white"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Comment ça marche
        </button>
      </div>

      <RiskDisclaimer />

      {maxActiveStrategies !== null && (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-xs font-semibold",
            quotaLocked
              ? "border-amber-400/20 bg-amber-500/[0.06] text-amber-200"
              : "border-white/10 bg-white/[0.03] text-white/50"
          )}
        >
          <span>
            {activeCount}/{maxActiveStrategies} stratégies actives ce mois-ci
          </span>
          {quotaLocked && (
            <span className="text-amber-300">
              Sélection verrouillée
              {quotaResetDate ? ` jusqu'au ${formatResetDate(quotaResetDate)}` : ""}
            </span>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-4 py-3 text-xs text-rose-300">
          {error}
        </p>
      )}

      <LockedOverlay
        locked={!hasActiveSubscription}
        cancelled={cancelled}
        message={
          cancelled
            ? "Abonnement annulé — réabonnez-vous pour continuer à utiliser le Copy Trading."
            : "Débloquez le Copy Trading — Débutez pour 0,99 €"
        }
      >
        {strategies.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
              <Users className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="text-sm font-semibold text-white">
              Aucun portefeuille suivi pour l&apos;instant
            </p>
            <p className="max-w-sm text-xs leading-relaxed text-white/45">
              Le copy trading se configure à partir des portefeuilles que vous
              suivez sur Smart Money. Suivez-en un pour créer votre première
              stratégie.
            </p>
            <Link
              href="/dashboard/smart-money"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-brand-400 bg-brand-500/15 px-4 py-2 text-xs font-semibold text-brand-400 transition-colors hover:bg-brand-500/25"
            >
              Aller sur Smart Money
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {strategies.map((strategy) => (
              <StrategyCard
                key={strategy.walletId}
                strategy={strategy}
                suggestionCount={
                  strategy.strategyId ? (suggestions[strategy.strategyId]?.length ?? 0) : 0
                }
                onConfigure={() => {
                  setSelectedWalletId(strategy.walletId);
                  setState("configure");
                }}
                onManage={() => {
                  setSelectedWalletId(strategy.walletId);
                  setState(strategy.riskParameters ? "active" : "configure");
                }}
                configureDisabled={quotaLocked && strategy.strategyId === null}
                configureDisabledReason={lockMessage}
              />
            ))}
          </div>
        )}
      </LockedOverlay>
    </div>
  );
}
