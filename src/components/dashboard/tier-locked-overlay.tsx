"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { meetsPlan, upgradeTargetPlan } from "@/lib/plan-access";
import type { PlanId } from "@/lib/stripe/plans";
import { cn } from "@/lib/utils";

/** Same blur-behind-an-unlock-CTA visual language as LockedOverlay (the
 * subscribed-vs-not paywall), generalized to the 3-tier structure: gates a
 * specific feature behind a `minRequiredPlan`, comparing it against the
 * user's `currentPlan` via the centralized meetsPlan() helper (see
 * lib/plan-access.ts) instead of a binary hasActiveAccess check. Every
 * tier-gated feature in the dashboard (on-demand scan, Smart Wallet cap
 * beyond the current plan, Coach IA cap, MoonX, ...) should use this
 * rather than duplicating its own plan comparison. */
export function TierLockedOverlay({
  currentPlan,
  minRequiredPlan,
  message,
  children,
  className,
  contentClassName,
}: {
  /** null for a user with no active subscription at all — never meets any
   * minRequiredPlan, always locked. */
  currentPlan: PlanId | null;
  minRequiredPlan: PlanId;
  /** Feature-specific explanation shown above the upgrade CTA. Falls back
   * to a generic "réservé à Pro+/Ultimate" message when omitted. */
  message?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const [redirecting, setRedirecting] = useState(false);
  const locale = useLocale();
  const t = useTranslations("Dashboard.TierGate");
  const locked = !meetsPlan(currentPlan, minRequiredPlan);
  const targetPlan = upgradeTargetPlan(minRequiredPlan);

  const handleUpgrade = async () => {
    if (redirecting) return;
    setRedirecting(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan, locale }),
      });
      const data = await response.json();
      if (data.changed) {
        // Plan change applied in place on the existing subscription (no
        // Stripe Checkout redirect needed, see /api/stripe/checkout) —
        // reload so every server-rendered gate re-evaluates against the
        // new plan.
        window.location.href = `/${locale}/dashboard/settings?checkout=success`;
        return;
      }
      if (!response.ok || !data.url) {
        throw new Error(data.message || "Checkout indisponible.");
      }
      window.location.href = data.url;
    } catch {
      setRedirecting(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {locked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-gradient-to-b from-dash-bg/50 via-dash-bg/80 to-dash-bg/95 px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
            <Lock className="h-5 w-5" strokeWidth={2} />
          </span>
          <p className="max-w-xs text-sm font-medium leading-relaxed text-dash-text">
            {message ?? t(`defaultMessage.${targetPlan}`)}
          </p>
          <Button type="button" onClick={handleUpgrade} disabled={redirecting}>
            {redirecting ? t("redirecting") : t(`cta.${targetPlan}`)}
            <ButtonIcon>→</ButtonIcon>
          </Button>
        </div>
      )}

      <div
        className={cn(
          contentClassName ?? "flex flex-col gap-5",
          locked && "pointer-events-none select-none blur-md"
        )}
        aria-hidden={locked}
      >
        {children}
      </div>
    </div>
  );
}
