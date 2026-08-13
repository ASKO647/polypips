"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
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
}: {
  locked: boolean;
  message: string;
  children: React.ReactNode;
}) {
  const [unlocking, setUnlocking] = useState(false);

  const handleUnlock = async () => {
    if (unlocking) return;
    setUnlocking(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "decouverte" }),
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
    <div className="relative">
      {locked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-gradient-to-b from-[#160b0c]/50 via-[#160b0c]/80 to-[#160b0c]/95 px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
            <Lock className="h-5 w-5" strokeWidth={2} />
          </span>
          <p className="max-w-xs text-sm font-medium leading-relaxed text-white/80">
            {message}
          </p>
          <Button type="button" onClick={handleUnlock} disabled={unlocking}>
            {unlocking ? "Redirection..." : "Débloquez — Débutez pour 0,99 €"}
            <ButtonIcon>→</ButtonIcon>
          </Button>
        </div>
      )}

      <div
        className={cn("flex flex-col gap-5", locked && "pointer-events-none select-none blur-md")}
        aria-hidden={locked}
      >
        {children}
      </div>
    </div>
  );
}
