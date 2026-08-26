"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ArrowRight, Check, Lock, RefreshCw, ShieldAlert, TriangleAlert } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { SIGNAL_RISK_DISCLAIMER, type SignalAnalysis } from "@/lib/data/signal-analysis";
import { SIGNAL_SOURCE_LABELS } from "@/lib/data/signal-wallets";
import { cn } from "@/lib/utils";

/** Memecoin prices are routinely sub-cent (e.g. 0.000045 $) — the default
 * toLocaleString rounds those to "0 $", which reads as a missing value
 * even though real data is present. Values under 1 get enough decimals to
 * stay meaningful; everything else keeps the normal 2-decimal formatting. */
function formatUsd(value: number): string {
  if (value !== 0 && Math.abs(value) < 1) {
    return `${value.toLocaleString("fr-FR", { maximumSignificantDigits: 4 })} $`;
  }
  return `${value.toLocaleString("fr-FR")} $`;
}

export function SignalAnalysisResult({
  analysis,
  onBack,
  locked = false,
}: {
  analysis: SignalAnalysis;
  onBack: () => void;
  locked?: boolean;
}) {
  const [unlocking, setUnlocking] = useState(false);
  const locale = useLocale();
  const scoreTone = analysis.polypipsScore >= 70 ? "text-emerald-400" : analysis.polypipsScore >= 40 ? "text-amber-400" : "text-rose-400";

  const handleUnlock = async () => {
    if (unlocking) return;
    setUnlocking(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "decouverte", locale }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.message || "Checkout indisponible.");
      window.location.href = data.url;
    } catch {
      setUnlocking(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/60">
            {SIGNAL_SOURCE_LABELS[analysis.source]}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
              analysis.side === "BUY" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
            )}
          >
            {analysis.side === "BUY" ? "Achat" : "Vente"}
          </span>
        </div>
        <h1 className="font-display text-xl font-bold leading-snug text-white sm:text-2xl">
          {analysis.tokenSymbol}
        </h1>
        {analysis.walletAddress && (
          <p className="font-mono text-xs text-white/40">{analysis.walletAddress}</p>
        )}
      </div>

      <div className="relative">
        {locked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-gradient-to-b from-[#160b0c]/50 via-[#160b0c]/80 to-[#160b0c]/95 px-6 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
              <Lock className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="max-w-xs text-sm font-medium leading-relaxed text-white/80">
              L&apos;analyse complète est réservée aux abonnés.
            </p>
            <Button type="button" onClick={handleUnlock} disabled={unlocking}>
              {unlocking ? "Redirection..." : "Débloquez cette analyse — Débutez pour 0,99 €"}
              <ButtonIcon>→</ButtonIcon>
            </Button>
          </div>
        )}

        <div
          className={cn("flex flex-col gap-5", locked && "pointer-events-none select-none blur-md")}
          aria-hidden={locked}
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Score PolyPips</p>
                <p className={cn("mt-1 font-display text-3xl font-bold", scoreTone)}>{analysis.polypipsScore}/100</p>
              </div>
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold",
                  analysis.decision === "copie" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.06] text-white/50"
                )}
              >
                {analysis.decision === "copie" ? <Check className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
                {analysis.decision === "copie" ? "COPY" : "IGNORE"}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              {[
                { label: "Montant", value: analysis.amountUsd },
                { label: "Prix", value: analysis.price },
                { label: "Market cap", value: analysis.marketCap },
                { label: "Liquidité", value: analysis.liquidity },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-white/35">{item.label}</p>
                  <p className="mt-0.5 font-semibold text-white">
                    {item.value !== null ? formatUsd(item.value) : "Donnée indisponible"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" strokeWidth={2} />
            <p className="text-xs leading-relaxed text-amber-200/90">{SIGNAL_RISK_DISCLAIMER}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Résumé</p>
            <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-[15px]">{analysis.summary}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                Points positifs
              </p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {analysis.positives.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm leading-relaxed text-white/70">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2.5} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
                Risques
              </p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {analysis.risks.map((risk) => (
                  <li key={risk} className="flex items-start gap-2 text-sm leading-relaxed text-white/70">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" strokeWidth={2} />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40">
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
              Conclusion
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/70">{analysis.conclusion}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button type="button" variant="outline" onClick={onBack} className="sm:flex-1">
          Nouvelle analyse
        </Button>
        <Button href="/dashboard/smart-wallets/suivis" className="sm:flex-1">
          Découvrir les Smart Wallets
          <ButtonIcon>
            <ArrowRight className="h-4 w-4" />
          </ButtonIcon>
        </Button>
      </div>
    </div>
  );
}
