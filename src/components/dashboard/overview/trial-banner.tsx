"use client";

import { useEffect, useMemo, useState } from "react";
import { Timer } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";

function daysRemainingFrom(trialEndsAt: string): number {
  const diffMs = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

/** Points to /dashboard/settings, not a fresh /api/stripe/checkout call —
 * this user already has an active (trialing) Stripe subscription, so
 * starting a new Checkout session here would create a second, conflicting
 * one instead of managing the existing one. Settings' Abonnement tab is
 * where upgrading an existing subscription actually happens
 * (/api/stripe/change-plan).
 *
 * Recomputes the days-remaining count from the real trial end date on an
 * hourly timer (not just on mount) so "3 jours" → "2 jours" → "1 jour"
 * ticks down live if the tab is left open across a day boundary, instead
 * of only updating on the next full page navigation. */
export function TrialBanner({ trialEndsAt }: { trialEndsAt: string }) {
  // `tick` only exists to force a recompute every hour — the actual value
  // is always derived fresh from the real trial end date, never drifts.
  const [tick, setTick] = useState(0);
  const daysRemaining = useMemo(() => {
    void tick; // forces the hourly recompute below; not itself part of the result
    return daysRemainingFrom(trialEndsAt);
  }, [trialEndsAt, tick]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-brand-400/20 bg-brand-500/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
          <Timer className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <p className="text-sm font-bold text-white">
            {daysRemaining > 0
              ? `Votre essai découverte expire dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}`
              : "Votre essai découverte expire aujourd'hui"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-white/50">
            Accès complet pendant l&apos;essai — puis 29,99 € / mois. Annulez
            quand vous voulez.
          </p>
        </div>
      </div>
      <Button type="button" href="/dashboard/settings" className="shrink-0">
        S&apos;abonner maintenant
        <ButtonIcon>→</ButtonIcon>
      </Button>
    </div>
  );
}
