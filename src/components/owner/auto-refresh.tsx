"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

/**
 * Re-fetches the Server Component tree on an interval (router.refresh())
 * plus a manual button — the closest honest approximation of "live" this
 * page can offer, since the underlying Vercel Analytics data itself isn't
 * pushed in real time (see RECENT_WINDOW_MINUTES in lib/vercel/analytics.ts).
 */
export function AutoRefresh({ intervalSeconds = 60 }: { intervalSeconds?: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [secondsLeft, setSecondsLeft] = useState(intervalSeconds);

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          startTransition(() => router.refresh());
          return intervalSeconds;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [intervalSeconds, router]);

  return (
    <button
      type="button"
      onClick={() => {
        setSecondsLeft(intervalSeconds);
        startTransition(() => router.refresh());
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10"
    >
      <RefreshCw className={pending ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
      {pending ? "Actualisation..." : `Actualiser (${secondsLeft}s)`}
    </button>
  );
}
