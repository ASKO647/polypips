import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Lock } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { ConfidenceMeter } from "@/components/dashboard/analyse-ia/confidence-meter";
import type { SportMatchAnalysis } from "@/lib/data/sports-analysis";
import type { Sport } from "@/lib/sports/types";
import { cn } from "@/lib/utils";

export function SportMatchCard({
  match,
  onViewDetail,
  locked = false,
}: {
  match: SportMatchAnalysis;
  onViewDetail: () => void;
  /** Same blur-but-still-browsable gating as MarketCard/TradingPairCard —
   * category/participants stay visible, the actual verdict is blurred for
   * a viewer with no active subscription. */
  locked?: boolean;
}) {
  const t = useTranslations("Sport.Selection");
  const tSport = useTranslations("Sport");
  const sportNames = tSport.raw("sportNames") as Record<Sport, string>;
  const locale = useLocale();
  const kickoffLabel = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(match.matchDate));

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold capitalize text-white/60">
          {sportNames[match.sport]}
        </span>
        {locked ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-white/40">
            <Lock className="h-3 w-3" strokeWidth={2.25} />
            {t("reserved")}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-400">
            {match.aiProbability}%
          </span>
        )}
      </div>

      <div>
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">
          {match.participants}
        </p>
        {match.competition && <p className="mt-1 text-xs text-white/40">{match.competition}</p>}
        <p className="mt-1 text-xs text-white/35">{kickoffLabel}</p>
      </div>

      <div
        className={cn("flex flex-col gap-4", locked && "pointer-events-none select-none blur-sm")}
        aria-hidden={locked}
      >
        <div>
          <p className="text-xs text-white/35">{t("predictedWinnerLabel")}</p>
          <p className="mt-0.5 text-sm font-bold text-white">{match.predictedWinner}</p>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-white/50">{match.explanation}</p>

        <div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold uppercase tracking-wide text-white/35">
              {t("confidenceLabel")}
            </span>
            <span className="font-bold text-white">{match.confidence}</span>
          </div>
          <ConfidenceMeter level={match.confidence} className="mt-1.5" />
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
