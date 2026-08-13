"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Pause, Play, Square } from "lucide-react";
import { RiskDisclaimer } from "@/components/dashboard/copy-trading/risk-disclaimer";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import type { RiskParameters, Strategy, Suggestion } from "@/lib/data/copy-trading";
import { createClient } from "@/lib/supabase/client";
import { cn, formatEUR } from "@/lib/utils";

const STATUS_LABEL: Record<Suggestion["status"], string> = {
  nouvelle: "Nouvelle",
  vue: "Vue",
  lien_cliquee: "Lien ouvert",
};

const STATUS_TONE: Record<Suggestion["status"], string> = {
  nouvelle: "bg-brand-500/15 text-brand-400",
  vue: "bg-white/10 text-white/60",
  lien_cliquee: "bg-emerald-500/15 text-emerald-400",
};

export function StrategyActive({
  strategy,
  params,
  suggestions: initialSuggestions,
  isPaused,
  onTogglePause,
  onStop,
  locked = false,
}: {
  strategy: Strategy;
  params: RiskParameters;
  suggestions: Suggestion[];
  isPaused: boolean;
  onTogglePause: () => Promise<void>;
  onStop: () => Promise<void>;
  /** True when the viewer has no active subscription — see LockedOverlay. */
  locked?: boolean;
}) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [pending, setPending] = useState(false);

  // New suggestions are surfaced via the notification bell — opening this
  // view is what "reading" them means, so mark them seen here.
  useEffect(() => {
    const unseenIds = initialSuggestions
      .filter((s) => s.status === "nouvelle")
      .map((s) => s.id);
    if (unseenIds.length === 0) return;

    // Opening this view is what "reading" a suggestion means — this marks
    // that against both local state and the database on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSuggestions((prev) =>
      prev.map((s) => (unseenIds.includes(s.id) ? { ...s, status: "vue" } : s))
    );

    const supabase = createClient();
    supabase
      .from("copy_trading_suggestions")
      .update({ status: "vue" })
      .in("id", unseenIds)
      .then(() => {});
    // Only run once per mount — re-running on every suggestions state
    // change would fight the optimistic update above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenSuggestion = async (suggestion: Suggestion) => {
    if (suggestion.status !== "lien_cliquee") {
      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === suggestion.id ? { ...s, status: "lien_cliquee" } : s
        )
      );
      const supabase = createClient();
      await supabase
        .from("copy_trading_suggestions")
        .update({ status: "lien_cliquee" })
        .eq("id", suggestion.id);
    }
    window.open(suggestion.marketUrl, "_blank", "noopener,noreferrer");
  };

  const handleTogglePause = async () => {
    if (pending) return;
    setPending(true);
    try {
      await onTogglePause();
    } finally {
      setPending(false);
    }
  };

  const handleStop = async () => {
    if (pending) return;
    setPending(true);
    try {
      await onStop();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Copy Trading — {strategy.walletLabel}
      </h1>

      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5",
          isPaused
            ? "border-amber-400/20 bg-amber-500/[0.06]"
            : "border-emerald-400/20 bg-emerald-500/[0.06]"
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-2.5 w-2.5 rounded-full",
              isPaused ? "bg-amber-400" : "animate-pulse-soft bg-emerald-400"
            )}
          />
          <div>
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-wide",
                isPaused ? "text-amber-400" : "text-emerald-400"
              )}
            >
              {isPaused ? "Stratégie en pause" : "Stratégie active"}
            </p>
            <p className="mt-0.5 font-display text-base font-bold text-white">
              {strategy.walletLabel}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={handleTogglePause}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-white/70 transition-colors hover:border-white/25 hover:text-white disabled:opacity-50"
          >
            {isPaused ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
            {isPaused ? "Reprendre" : "Mettre en pause"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleStop}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/25 bg-rose-500/[0.08] px-3.5 py-2 text-xs font-semibold text-rose-400 transition-colors hover:border-rose-400/40 disabled:opacity-50"
          >
            <Square className="h-3.5 w-3.5" />
            Arrêter
          </button>
        </div>
      </div>

      <RiskDisclaimer />

      <LockedOverlay
        locked={locked}
        message="Les suggestions détaillées reçues pour cette stratégie sont réservées aux abonnés."
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
            Paramètres configurés
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-white/35">Montant max / mouvement</p>
              <p className="mt-0.5 font-semibold text-white">
                {formatEUR(params.maxPositionAmount)}
              </p>
            </div>
            <div>
              <p className="text-white/35">Exposition max</p>
              <p className="mt-0.5 font-semibold text-white">
                {params.maxExposure}%
              </p>
            </div>
            <div>
              <p className="text-white/35">Suggestions actives max</p>
              <p className="mt-0.5 font-semibold text-white">
                {params.maxSimultaneousPositions}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
            Suggestions reçues
          </p>
          <p className="mt-1 text-[11px] text-white/30">
            Ce sont des alertes, jamais des ordres exécutés. Cliquez pour
            ouvrir le marché sur Polymarket et décider vous-même.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {suggestions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-white/35">
                Aucune suggestion reçue pour le moment. Vous serez notifié dès
                qu&apos;un mouvement de {strategy.walletLabel} correspond à
                vos paramètres.
              </p>
            ) : (
              suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleOpenSuggestion(suggestion)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:border-white/20"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="truncate text-sm text-white/85">
                      {suggestion.marketQuestion}
                    </p>
                    <span className="flex flex-wrap items-center gap-2 text-[11px] text-white/35">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-bold",
                          STATUS_TONE[suggestion.status]
                        )}
                      >
                        {STATUS_LABEL[suggestion.status]}
                      </span>
                      {suggestion.side} · {suggestion.createdAgo}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {formatEUR(suggestion.amount)}
                    </span>
                    <ExternalLink className="h-4 w-4 text-white/40" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </LockedOverlay>
    </div>
  );
}
