"use client";

import type { ComponentType, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Same blur-over-content visual language as LockedOverlay (the paywall
 * gate on Analyse IA/Marchés/Smart Wallet) — reused here for a
 * different reason: not "subscribe to unlock" but "not ready yet, no CTA
 * that leads anywhere real". No Stripe checkout, no unlock state — just a
 * permanent blurred placeholder with a message and an optional secondary
 * action (e.g. "Comment ça marche"). Deliberately never fetches or renders
 * real data behind the blur — a CSS blur is a rendering effect, not a
 * privacy boundary (inspectable via devtools), so the decorative content
 * behind it must itself be safe to reveal. Callers pass their own
 * `children` (a static, non-real mock) or omit it for the built-in
 * generic skeleton. */
export function ComingSoonBlur({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  /** Optional secondary link/button rendered under the description — e.g.
   * a "Comment ça marche" explainer that doesn't unlock anything. */
  action?: ReactNode;
  /** Decorative content shown blurred behind the overlay. Must be static/
   * generic — never real fetched data (see file comment). Falls back to a
   * built-in skeleton when omitted. */
  children?: ReactNode;
  className?: string;
}) {
  const t = useTranslations("Dashboard.ComingSoonBlur");

  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-gradient-to-b from-dash-bg/50 via-dash-bg/80 to-dash-bg/95 px-6 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-400">{t("eyebrow")}</p>
          <p className="max-w-sm text-lg font-bold text-dash-text">{title}</p>
          <p className="max-w-sm text-sm leading-relaxed text-dash-text-secondary">{description}</p>
        </div>
        {action}
      </div>

      <div className="pointer-events-none select-none blur-md" aria-hidden="true">
        {children ?? <GenericSkeleton />}
      </div>
    </div>
  );
}

function GenericSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-8 w-48 rounded-lg bg-dash-surface" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-2xl border border-dash-border bg-dash-surface p-5">
            <div className="h-4 w-24 rounded bg-dash-surface-strong" />
            <div className="h-3 w-full rounded bg-dash-surface-strong" />
            <div className="h-3 w-2/3 rounded bg-dash-surface-strong" />
          </div>
        ))}
      </div>
    </div>
  );
}
