import { ArrowRight, ExternalLink, Lock } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { ConfidenceMeter } from "@/components/dashboard/analyse-ia/confidence-meter";
import { polymarketEventUrl, type MarketAnalysis } from "@/lib/data/analysis";
import { cn } from "@/lib/utils";

export function MarketCard({
  market,
  onViewDetail,
  locked = false,
}: {
  market: MarketAnalysis;
  onViewDetail: () => void;
  /** True when the viewer has no active subscription: the category and
   * question stay visible (so the list is still browsable) but the actual
   * analysis content — decision, probabilities, edge, score, confidence,
   * explanation — is blurred out rather than given away for free. */
  locked?: boolean;
}) {
  const isYes = market.decision === "YES";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/60">
          {market.category}
        </span>
        {locked ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-white/40">
            <Lock className="h-3 w-3" strokeWidth={2.25} />
            Réservé
          </span>
        ) : (
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
              isYes
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-rose-500/15 text-rose-400"
            )}
          >
            {market.decision} {market.aiProbability}%
          </span>
        )}
      </div>

      <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">
        {market.question}
      </p>

      {market.marketSlug && (
        <a
          href={polymarketEventUrl(market.marketSlug)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1 text-xs font-medium text-white/40 transition-colors hover:text-white/70"
        >
          Voir sur Polymarket
          <ExternalLink className="h-3 w-3" strokeWidth={2.25} />
        </a>
      )}

      <div
        className={cn("flex flex-col gap-4", locked && "pointer-events-none select-none blur-sm")}
        aria-hidden={locked}
      >
        <p className="line-clamp-2 text-xs leading-relaxed text-white/50">
          {market.explanation}
        </p>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-white/35">Marché</p>
            <p className="mt-0.5 font-semibold text-white">
              {market.marketProbability}%
            </p>
          </div>
          <div>
            <p className="text-white/35">Edge</p>
            <p
              className={cn(
                "mt-0.5 font-semibold",
                market.edge >= 0 ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {market.edge >= 0 ? "+" : ""}
              {market.edge}%
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold uppercase tracking-wide text-white/35">
              Score d&apos;opportunité
            </span>
            <span className="font-bold text-white">
              {market.opportunityScore}/100
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${market.opportunityScore}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold uppercase tracking-wide text-white/35">
              Confiance
            </span>
            <span className="font-bold text-white">{market.confidence}</span>
          </div>
          <ConfidenceMeter level={market.confidence} className="mt-1.5" />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onViewDetail}
        className="mt-1 w-full"
      >
        {locked ? "Débloquer cette analyse" : "Voir l'analyse complète"}
        <ButtonIcon variant="outline">
          {locked ? <Lock className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </ButtonIcon>
      </Button>
    </div>
  );
}
