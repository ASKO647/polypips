import { useTranslations } from "next-intl";
import { ArrowDown, ArrowRight, ArrowUp, Lock, Minus } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { ConfidenceMeter } from "@/components/dashboard/analyse-ia/confidence-meter";
import { getRecommendationLabel, type TradingChartAnalysis } from "@/lib/data/trading-analysis";
import { cn } from "@/lib/utils";

const RECOMMENDATION_STYLE: Record<
  TradingChartAnalysis["recommendation"],
  { icon: typeof ArrowUp; tone: string; bg: string }
> = {
  Acheter: { icon: ArrowUp, tone: "text-emerald-400", bg: "bg-emerald-500/15" },
  Vendre: { icon: ArrowDown, tone: "text-rose-400", bg: "bg-rose-500/15" },
  Attendre: { icon: Minus, tone: "text-amber-400", bg: "bg-amber-500/15" },
};

export function TradingPairCard({
  analysis,
  onViewDetail,
  locked = false,
}: {
  analysis: TradingChartAnalysis;
  onViewDetail: () => void;
  /** Same blur-but-still-browsable gating as MarketCard/SportMatchCard. */
  locked?: boolean;
}) {
  const t = useTranslations("Trading.Selection");
  const tTrading = useTranslations("Trading");
  const { icon: RecoIcon, tone, bg } = RECOMMENDATION_STYLE[analysis.recommendation];

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/60">
          {analysis.instrument}
        </span>
        {locked ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-white/40">
            <Lock className="h-3 w-3" strokeWidth={2.25} />
            {t("reserved")}
          </span>
        ) : (
          <span className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", bg, tone)}>
            <RecoIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            {getRecommendationLabel(tTrading, analysis.recommendation)}
          </span>
        )}
      </div>

      {analysis.timeframe && <p className="text-xs text-white/35">{analysis.timeframe}</p>}

      <div
        className={cn("flex flex-col gap-4", locked && "pointer-events-none select-none blur-sm")}
        aria-hidden={locked}
      >
        <p className="line-clamp-2 text-xs leading-relaxed text-white/50">{analysis.trendAnalysis}</p>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-white/35">{t("takeProfitLabel")}</p>
            <p className="mt-0.5 font-semibold text-emerald-400">{analysis.takeProfit ?? "—"}</p>
          </div>
          <div>
            <p className="text-white/35">{t("stopLossLabel")}</p>
            <p className="mt-0.5 font-semibold text-rose-400">{analysis.stopLoss ?? "—"}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold uppercase tracking-wide text-white/35">
              {t("confidenceLabel")}
            </span>
            <span className="font-bold text-white">{analysis.confidence}</span>
          </div>
          <ConfidenceMeter level={analysis.confidence} className="mt-1.5" />
        </div>
      </div>

      <Button type="button" variant="outline" onClick={onViewDetail} className="mt-1 w-full">
        {locked ? t("unlockButton") : t("viewFullAnalysis")}
        <ButtonIcon variant="outline">
          {locked ? <Lock className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </ButtonIcon>
      </Button>
    </div>
  );
}
