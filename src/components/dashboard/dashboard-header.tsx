"use client";

import Image from "next/image";
import { Link, usePathname } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Menu, X } from "lucide-react";
import { NotificationsBell } from "@/components/dashboard/notifications-bell";
import { DASHBOARD_NAV_ITEMS, DASHBOARD_RESOURCE_ITEMS } from "@/lib/data/dashboard-nav";
import type { NotificationItem } from "@/lib/data/notifications";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";

/** Longest-prefix match so a sub-route like /dashboard/community/abc123
 * still resolves to "Communauté" rather than falling through to null. */
function pageTitleFor(pathname: string): string | null {
  const items = [...DASHBOARD_NAV_ITEMS, ...DASHBOARD_RESOURCE_ITEMS];
  const match = items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? null;
}

function daysRemainingFrom(trialEndsAt: string): number {
  const diffMs = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

/** Merges the old full-width TrialBanner's "expire dans X jours" copy into
 * this same pill instead of a separate CTA banner — there is no higher paid
 * tier to upsell to (single-tier pricing: discovery trial rolls straight
 * into Pro), so the count is purely informational now, never a button. */
function planPillLabel(
  subscription: SubscriptionRow | null,
  cancelled: boolean,
  trialDaysRemaining: number | null
): string {
  if (!subscription || cancelled) return "Aucun abonnement";
  if (subscription.status === "trialing") {
    if (trialDaysRemaining === null) return "Offre découverte";
    return trialDaysRemaining > 0
      ? `Offre découverte · ${trialDaysRemaining} j restant${trialDaysRemaining > 1 ? "s" : ""}`
      : "Offre découverte · dernier jour";
  }
  if (subscription.status === "past_due") return "Paiement en échec";
  return "Polypips Pro";
}

export function DashboardHeader({
  menuOpen,
  onMenuToggle,
  notifications,
  subscription,
  cancelled,
  trialEndsAt,
}: {
  menuOpen: boolean;
  onMenuToggle: () => void;
  notifications: NotificationItem[];
  subscription: SubscriptionRow | null;
  cancelled: boolean;
  /** ISO end-of-trial date, only while genuinely still trialing (not
   * cancelled) — null otherwise. Recomputed into a days-remaining count on
   * an hourly timer (not just on mount) so it keeps ticking down without a
   * page reload. */
  trialEndsAt: string | null;
}) {
  const pathname = usePathname();
  const pageTitle = pageTitleFor(pathname);
  const showBack = pathname !== "/dashboard";

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!trialEndsAt) return;
    const interval = setInterval(() => setTick((t) => t + 1), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [trialEndsAt]);
  const trialDaysRemaining = useMemo(() => {
    void tick; // forces the hourly recompute above; not itself part of the result
    return trialEndsAt ? daysRemainingFrom(trialEndsAt) : null;
  }, [trialEndsAt, tick]);

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-white/10 bg-[#160b0c]/95 px-5 backdrop-blur-md lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        {showBack ? (
          <>
            <Link
              href="/dashboard"
              aria-label="Retour au tableau de bord"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition-colors duration-150 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            </Link>
            {pageTitle && (
              <span className="truncate font-display text-sm font-bold text-white sm:text-base">
                {pageTitle}
              </span>
            )}
          </>
        ) : (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 lg:hidden"
            aria-label="Polypips — tableau de bord"
          >
            <Image
              src="/polypips-mark.png"
              alt=""
              width={290}
              height={322}
              className="h-6 w-auto"
            />
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/70">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
          {planPillLabel(subscription, cancelled, trialDaysRemaining)}
        </span>

        <NotificationsBell notifications={notifications} />

        <button
          type="button"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          onClick={onMenuToggle}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-transform duration-150 ease-out hover:scale-105 hover:text-white active:scale-95 lg:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
