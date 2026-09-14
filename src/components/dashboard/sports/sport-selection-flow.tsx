"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { SportMatchResult } from "@/components/dashboard/sports/sport-match-result";
import { SportMatchCard } from "@/components/dashboard/sports/sport-match-card";
import { SyncCountdown } from "@/components/dashboard/sync-countdown";
import type { SportMatchAnalysis } from "@/lib/data/sports-analysis";
import { SYNC_SPORT_SELECTION_INTERVAL_MINUTES } from "@/lib/data/sports-analysis";

export function SportSelectionFlow({
  matches,
  hasActiveSubscription,
  lastSyncedAt,
}: {
  matches: SportMatchAnalysis[];
  hasActiveSubscription: boolean;
  lastSyncedAt: string | null;
}) {
  const t = useTranslations("Sport.Selection");
  const [selected, setSelected] = useState<SportMatchAnalysis | null>(null);

  if (selected) {
    return (
      <SportMatchResult
        analysis={selected}
        onBack={() => setSelected(null)}
        backLabel={t("backToListLabel")}
        locked={!hasActiveSubscription}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {t("heading")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
            {t("subtitle")}
          </p>
        </div>
        <SyncCountdown
          lastSyncedAt={lastSyncedAt}
          intervalMinutes={SYNC_SPORT_SELECTION_INTERVAL_MINUTES}
          label={t("countdownLabel")}
        />
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
            <Sparkles className="h-5 w-5" strokeWidth={2} />
          </span>
          <p className="text-sm font-semibold text-white">{t("emptyTitle")}</p>
          <p className="max-w-sm text-xs leading-relaxed text-white/45">{t("emptyDescription")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <SportMatchCard
              key={match.id}
              match={match}
              onViewDetail={() => setSelected(match)}
              locked={!hasActiveSubscription}
            />
          ))}
        </div>
      )}
    </div>
  );
}
