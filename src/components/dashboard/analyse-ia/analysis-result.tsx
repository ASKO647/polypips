import {
  ArrowRight,
  Check,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import type { ConfidenceLevel, MarketAnalysis } from "@/lib/data/analysis";
import { cn } from "@/lib/utils";

const CONFIDENCE_LEVEL_INDEX: Record<ConfidenceLevel, number> = {
  Faible: 1,
  Moyenne: 2,
  Élevée: 3,
};

export function AnalysisResult({
  analysis,
  onNewAnalysis,
}: {
  analysis: MarketAnalysis;
  onNewAnalysis: () => void;
}) {
  const isYes = analysis.decision === "YES";
  const decisionTone = isYes ? "text-emerald-400" : "text-rose-400";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/60">
            {analysis.category}
          </span>
          <span className="text-xs text-white/35">{analysis.analyzedAt}</span>
        </div>
        <h1 className="font-display text-xl font-bold leading-snug text-white sm:text-2xl">
          {analysis.question}
        </h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-base font-black",
                isYes
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-rose-500/15 text-rose-400"
              )}
            >
              {analysis.decision}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                Décision IA
              </p>
              <p className={cn("font-display text-3xl font-bold", decisionTone)}>
                {analysis.aiProbability}%
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                Marché
              </p>
              <p className="mt-1 text-xl font-bold text-white">
                {analysis.marketProbability}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                Edge
              </p>
              <p
                className={cn(
                  "mt-1 text-xl font-bold",
                  analysis.edge >= 0 ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {analysis.edge >= 0 ? "+" : ""}
                {analysis.edge}%
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wide text-white/40">
                Score d&apos;opportunité
              </span>
              <span className="font-bold text-white">
                {analysis.opportunityScore}/100
              </span>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${analysis.opportunityScore}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wide text-white/40">
                Niveau de confiance
              </span>
              <span className="font-bold text-white">{analysis.confidence}</span>
            </div>
            <div className="mt-2.5 flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2 flex-1 rounded-full",
                    i < CONFIDENCE_LEVEL_INDEX[analysis.confidence]
                      ? "bg-brand-500"
                      : "bg-white/10"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <ShieldAlert className="h-4 w-4 shrink-0 text-white/30" strokeWidth={2} />
        <p className="text-xs leading-relaxed text-white/40">
          Cette analyse est une estimation probabiliste, pas une garantie de
          gain.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Explication
        </p>
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
              <li
                key={factor}
                className="flex items-start gap-2 text-sm leading-relaxed text-white/70"
              >
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400"
                  strokeWidth={2.5}
                />
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
              <li
                key={risk}
                className="flex items-start gap-2 text-sm leading-relaxed text-white/70"
              >
                <TriangleAlert
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400"
                  strokeWidth={2}
                />
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
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          {analysis.whatCouldChange}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Sources utilisées
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {analysis.sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-white/30" />
                {source.name}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onNewAnalysis}
          className="sm:flex-1"
        >
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
