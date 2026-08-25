"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ArrowRight, Check, Lock, RefreshCw, ShieldAlert, TrendingUp, TriangleAlert } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { ConfidenceMeter } from "@/components/dashboard/analyse-ia/confidence-meter";
import { RESPONSIBLE_BETTING_DISCLAIMER, type SportBetAnalysis } from "@/lib/data/sports-analysis";
import { cn } from "@/lib/utils";

export function SportsAnalysisResult({
  analysis,
  onBack,
  locked = false,
}: {
  analysis: SportBetAnalysis;
  onBack: () => void;
  /** Same paywall pattern as Polymarket's Analyse IA — the verdict still
   * runs (proving the product works) but its content is blurred behind an
   * unlock CTA for a viewer with no active subscription. */
  locked?: boolean;
}) {
  const [unlocking, setUnlocking] = useState(false);
  const locale = useLocale();
  const edgeTone = analysis.edge >= 0 ? "text-emerald-400" : "text-rose-400";

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
      if (!response.ok || !data.url) {
        throw new Error(data.message || "Checkout indisponible.");
      }
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
            {analysis.sport}
          </span>
          <span className="text-xs text-white/35">{analysis.betType}</span>
        </div>
        <h1 className="font-display text-xl font-bold leading-snug text-white sm:text-2xl">
          {analysis.participants}
        </h1>
        <p className="text-sm text-white/50">
          Sélection analysée : <span className="font-semibold text-white">{analysis.selection}</span>{" "}
          — cote {analysis.bookmakerOdds}
        </p>
      </div>

      <div className="relative">
        {locked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-gradient-to-b from-[#160b0c]/50 via-[#160b0c]/80 to-[#160b0c]/95 px-6 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
              <Lock className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="max-w-xs text-sm font-medium leading-relaxed text-white/80">
              L&apos;edge complet et l&apos;explication détaillée sont réservés aux abonnés.
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
                <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                  Estimation IA
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-white">
                  {analysis.aiProbability}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                  Cote du bookmaker
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {analysis.bookmakerImpliedProbability}%
                </p>
                <p className="text-xs text-white/35">probabilité implicite</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Edge</p>
                <p className={cn("mt-1 text-xl font-bold", edgeTone)}>
                  {analysis.edge >= 0 ? "+" : ""}
                  {analysis.edge}%
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wide text-white/40">
                  Niveau de confiance
                </span>
                <span className="font-bold text-white">{analysis.confidence}</span>
              </div>
              <ConfidenceMeter level={analysis.confidence} className="mt-2.5" />
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" strokeWidth={2} />
            <p className="text-xs leading-relaxed text-amber-200/90">
              {RESPONSIBLE_BETTING_DISCLAIMER}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Explication</p>
            <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-[15px]">
              {analysis.explanation}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.25} />
                Facteurs favorables
              </p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {analysis.favorableFactors.map((factor) => (
                  <li key={factor} className="flex items-start gap-2 text-sm leading-relaxed text-white/70">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2.5} />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
                <TriangleAlert className="h-3.5 w-3.5" strokeWidth={2.25} />
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
              Ce qui pourrait faire changer l&apos;analyse
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/70">{analysis.whatCouldChange}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button type="button" variant="outline" onClick={onBack} className="sm:flex-1">
          Nouvelle analyse
        </Button>
        <Button href="/dashboard/coach" className="sm:flex-1">
          Poser une question au Coach IA
          <ButtonIcon>
            <ArrowRight className="h-4 w-4" />
          </ButtonIcon>
        </Button>
      </div>
    </div>
  );
}
