"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { useCountdown } from "@/lib/hooks/use-countdown";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Live-ticking "next refresh" indicator, shared by every dashboard page
 * backed by a periodic Edge Function scan (Smart Wallet's sync-smart-money,
 * Markets' scan-markets, ...) — the Edge Function keeps its original
 * `sync-smart-money` name even though the product-facing feature it powers
 * is now called Smart Wallet. The deadline is derived client-side from the
 * most recent real sync timestamp (passed down from the server) plus the
 * caller's own assumed cron interval — there's no push channel telling the
 * browser when the next run actually lands, so once the countdown hits zero
 * it just reads the translated "refreshing shortly" copy until the next
 * full page load picks up a fresher lastSyncedAt.
 */
export function SyncCountdown({
  lastSyncedAt,
  intervalMinutes,
  label,
}: {
  lastSyncedAt: string | null;
  /** How often the backing cron actually runs, in minutes — kept in sync
   * by hand with whatever schedule is configured for the Edge Function
   * (see each caller's own constant for the current value + why it can't
   * be read back from the database). */
  intervalMinutes: number;
  /** Defaults to the translated "Prochains marchés dans" / "Next markets
   * in" — pass an explicit label only when a caller needs different
   * wording. */
  label?: string;
}) {
  const t = useTranslations("Dashboard.SyncCountdown");
  // Lazy initializer so the "never synced yet" fallback reads Date.now()
  // exactly once (on mount), not on every render.
  const [fallbackNow] = useState(() => Date.now());
  // useCountdown's effect depends on `deadline` by reference — without this
  // memo, a fresh `new Date(...)` on every render would re-fire that effect
  // every render (its own setState triggering the next render), which is an
  // infinite loop, not just a wasted allocation.
  const deadline = useMemo(() => {
    const baseTime = lastSyncedAt ? new Date(lastSyncedAt).getTime() : fallbackNow;
    return new Date(baseTime + intervalMinutes * 60_000);
  }, [lastSyncedAt, fallbackNow, intervalMinutes]);
  const { hours, minutes, seconds } = useCountdown(deadline);

  const isImminent = hours === 0 && minutes === 0 && seconds === 0;

  return (
    <div className="flex w-fit shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/60">
      <Clock className="h-3.5 w-3.5 shrink-0 text-brand-400" strokeWidth={2} />
      {isImminent ? (
        <span>{t("refreshingImminent")}</span>
      ) : (
        <span className="tabular-nums">
          {label ?? t("defaultLabel")} : {hours > 0 ? `${pad(hours)}:` : ""}
          {pad(minutes)}:{pad(seconds)}
        </span>
      )}
    </div>
  );
}
