"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityMovement = {
  id: string;
  message: string;
  occurredAt: string;
};

const DISMISS_KEY = "polypips_smart_money_popup_dismissed";
const REFRESH_INTERVAL_MS = 60_000;
const CYCLE_INTERVAL_MS = 9_000;
const FADE_MS = 300;
const FIRST_APPEARANCE_DELAY_MS = 1_500;

/** Landing-page-only toast showing real, recent, significant Smart Money
 * movements (see /api/public/smart-money-activity — backed by
 * get_public_smart_money_activity, never invented data). Not mounted
 * anywhere near /dashboard. */
export function SmartMoneyActivityPopup() {
  const t = useTranslations("SmartMoneyPopup");

  // Lazy initializer: dismissed only ever changes the render output once
  // `current` is also set (elsewhere, post-mount), so this never causes a
  // server/client hydration mismatch even though sessionStorage is
  // unavailable during SSR.
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  });
  const [current, setCurrent] = useState<ActivityMovement | null>(null);
  const [visible, setVisible] = useState(false);
  const movementsRef = useRef<ActivityMovement[]>([]);
  const lastMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (dismissed) return;

    let cancelled = false;

    async function fetchMovements() {
      try {
        const res = await fetch("/api/public/smart-money-activity");
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (Array.isArray(json.movements)) {
          movementsRef.current = json.movements;
        }
      } catch {
        // Keeps whatever was already loaded — the cycle just skips a beat.
      }
    }

    function cycle() {
      const pool = movementsRef.current;
      if (pool.length === 0) {
        setVisible(false);
        return;
      }
      let next = pool[Math.floor(Math.random() * pool.length)];
      if (pool.length > 1) {
        while (next.message === lastMessageRef.current) {
          next = pool[Math.floor(Math.random() * pool.length)];
        }
      }
      lastMessageRef.current = next.message;
      setCurrent(next);
      setVisible(true);
    }

    fetchMovements();
    const refreshInterval = setInterval(fetchMovements, REFRESH_INTERVAL_MS);
    const firstTimeout = setTimeout(cycle, FIRST_APPEARANCE_DELAY_MS);
    const cycleInterval = setInterval(() => {
      setVisible(false);
      setTimeout(cycle, FADE_MS);
    }, CYCLE_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(firstTimeout);
      clearInterval(cycleInterval);
      clearInterval(refreshInterval);
    };
  }, [dismissed]);

  function handleClose() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    setVisible(false);
  }

  if (dismissed || !current) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-44 right-4 z-40 w-[300px] max-w-[calc(100vw-2rem)] transition-all duration-300 sm:bottom-24 sm:right-6 sm:w-[340px]",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      )}
    >
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[0_20px_50px_-16px_rgba(23,11,13,0.2)]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
          <TrendingUp className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-body/60">
            {t("label")}
          </p>
          <p className="mt-1 text-sm leading-snug text-ink">{current.message}</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label={t("close")}
          className="shrink-0 rounded-full p-1 text-body/50 transition-colors hover:bg-black/5 hover:text-ink"
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
