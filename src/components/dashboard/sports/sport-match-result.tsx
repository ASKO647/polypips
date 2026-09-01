"use client";

import { ArrowRight, Check, RefreshCw, TrendingUp, TriangleAlert, ShieldAlert } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { ConfidenceMeter } from "@/components/dashboard/analyse-ia/confidence-meter";
import type { SportMatchAnalysis } from "@/lib/data/sports-analysis";
import { cn } from "@/lib/utils";

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function SportMatchResult({
  analysis,
  onBack,
  backLabel = "Nouvelle analyse",
}: {
  analysis: SportMatchAnalysis;
  onBack: () => void;
  backLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold capitalize text-white/60">
            {analysis.sport === "football" ? "Football" : "Basketball"}
          </span>
          {analysis.competition && (
            <span className="text-xs text-white/35">{analysis.competition}</span>
          )}
          <span className="text-xs text-white/35">{analysis.analyzedAt}</span>
        </div>
        <h1 className="font-display text-xl font-bold leading-snug text-white sm:text-2xl">
          {analysis.participants}
        </h1>
        <p className="text-xs text-white/40">{DATE_FORMATTER.format(new Date(analysis.matchDate))}</p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 px-1.5 text-center text-sm font-black leading-tight text-emerald-400">
                {analysis.predictedWinner}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                  Pronostic IA
                </p>
                <p className="font-display text-3xl font-bold text-emerald-400">
                  {analysis.aiProbability}%
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                Niveau de confiance
              </p>
              <p className="mt-1 text-xl font-bold text-white">{analysis.confidence}</p>
              <ConfidenceMeter level={analysis.confidence} className="mt-2.5 w-32" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <ShieldAlert className="h-4 w-4 shrink-0 text-white/30" strokeWidth={2} />
          <p className="text-xs leading-relaxed text-white/40">
            Ce pronostic est une estimation probabiliste, pas une garantie de résultat.
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
            Ce qui pourrait faire changer le pronostic
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/70">{analysis.whatCouldChange}</p>
        </div>

        {analysis.secondaryMarkets.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Autres marchés pertinents sur ce match
            </p>
            <div className="mt-3 flex flex-col gap-3">
              {analysis.secondaryMarkets.map((m) => (
                <div
                  key={m.market}
                  className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{m.market}</p>
                    <span
                      className={cn(
                        "inline-flex w-fit items-center rounded-full bg-brand-500/15 px-2.5 py-0.5 text-xs font-bold text-brand-400"
                      )}
                    >
                      {m.suggestion}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/50">{m.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button type="button" variant="outline" onClick={onBack} className="sm:flex-1">
          {backLabel}
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
