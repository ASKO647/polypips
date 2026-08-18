"use client";

import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { SYNC_SMART_MONEY_INTERVAL_MINUTES } from "@/lib/data/smart-money";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Live-ticking "next refresh" indicator for the Smart Money page. The
 * deadline is derived client-side from the most recent lastSyncedAt across
 * all tracked wallets (passed down from the server) plus the assumed cron
 * interval — there's no push channel telling the browser when the next run
 * actually lands, so once the countdown hits zero it just reads "imminente"
 * until the next full page load picks up a fresher lastSyncedAt.
 */
export function SmartMoneySyncCountdown({
  lastSyncedAt,
}: {
  lastSyncedAt: string | null;
}) {
  // Lazy initializer so the "never synced yet" fallback reads Date.now()
  // exactly once (on mount), not on every render.
  const [fallbackNow] = useState(() => Date.now());
  // useCountdown's effect depends on `deadline` by reference — without this
  // memo, a fresh `new Date(...)` on every render would re-fire that effect
  // every render (its own setState triggering the next render), which is an
  // infinite loop, not just a wasted allocation.
  const deadline = useMemo(() => {
    const baseTime = lastSyncedAt ? new Date(lastSyncedAt).getTime() : fallbackNow;
    return new Date(baseTime + SYNC_SMART_MONEY_INTERVAL_MINUTES * 60_000);
  }, [lastSyncedAt, fallbackNow]);
  const { hours, minutes, seconds } = useCountdown(deadline);

  const isImminent = hours === 0 && minutes === 0 && seconds === 0;

  return (
    <div className="flex w-fit shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/60">
      <Clock className="h-3.5 w-3.5 shrink-0 text-brand-400" strokeWidth={2} />
      {isImminent ? (
        <span>Actualisation imminente…</span>
      ) : (
        <span className="tabular-nums">
          Prochains marchés dans : {hours > 0 ? `${pad(hours)}:` : ""}
          {pad(minutes)}:{pad(seconds)}
        </span>
      )}
    </div>
  );
}
