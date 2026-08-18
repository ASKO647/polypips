"use client";

import { useState } from "react";
import { Lock, RefreshCw } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Same blur-behind-an-unlock-CTA pattern used on the Analyse IA / Marchés
 * detail views (see AnalysisResult's `locked` prop) — extracted here since
 * Smart Money and Copy Trading both need the same gate on content that
 * already rendered (proving the product works) but shouldn't be usable
 * without an active subscription. */
export function LockedOverlay({
  locked,
  message,
  children,
  className,
  contentClassName,
  cancelled = false,
}: {
  locked: boolean;
  message: string;
  children: React.ReactNode;
  /** Merged onto the outer relative wrapper — for callers that need it to
   * stretch to fill a flex parent (e.g. a fixed-height chat panel). */
  className?: string;
  /** Replaces the content wrapper's default "flex flex-col gap-5" — for
   * callers whose children need a different layout (e.g. Coach IA's chat
   * panel, which is itself a flex column with its own header/messages/input
   * structure, not a simple vertical stack of cards). */
  contentClassName?: string;
  /** True when `locked` is caused by a cancellation rather than never
   * having subscribed — swaps the "Débutez pour 0,99 €" first-time CTA for
   * a smaller, quieter "réabonnez-vous" one and resubscribes straight to
   * Pro instead of re-selling the discovery trial to someone who already
   * had one. `message` is still fully caller-provided either way. */
  cancelled?: boolean;
}) {
  const [unlocking, setUnlocking] = useState(false);

  const handleUnlock = async () => {
    if (unlocking) return;
    setUnlocking(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: cancelled ? "pro" : "decouverte" }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.message || "Checkout indisponible.");
      }
      window.location.href = data.url;
    } catch {
      setUnlocking(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {locked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-gradient-to-b from-[#160b0c]/50 via-[#160b0c]/80 to-[#160b0c]/95 px-6 py-10 text-center">
          <span
            className={cn(
              "flex items-center justify-center rounded-full",
              cancelled
                ? "h-9 w-9 bg-white/10 text-white/60"
                : "h-12 w-12 bg-brand-500/15 text-brand-400"
            )}
          >
            {cancelled ? (
              <RefreshCw className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Lock className="h-5 w-5" strokeWidth={2} />
            )}
          </span>
          <p
            className={cn(
              "max-w-xs leading-relaxed",
              cancelled ? "text-xs font-medium text-white/60" : "text-sm font-medium text-white/80"
            )}
          >
            {message}
          </p>
          <Button
            type="button"
            size={cancelled ? "sm" : "md"}
            onClick={handleUnlock}
            disabled={unlocking}
          >
            {unlocking
              ? "Redirection..."
              : cancelled
                ? "Réabonnez-vous"
                : "Débloquez — Débutez pour 0,99 €"}
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
