"use client";

import Image from "next/image";
import { Link, usePathname } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Menu, X } from "lucide-react";
import { NotificationsBell } from "@/components/dashboard/notifications-bell";
import { ProfileMenu } from "@/components/dashboard/profile-menu";
import {
  DASHBOARD_GLOBAL_ITEMS,
  DASHBOARD_RESOURCE_ITEMS,
  DASHBOARD_TOP_ITEM,
  POLYMARKET_NAV_ITEMS,
  SPORTS_TITLE_ITEM,
  TRADING_NAV_ITEMS,
} from "@/lib/data/dashboard-nav";
import type { NotificationItem } from "@/lib/data/notifications";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";

/** Longest-prefix match so a sub-route like /dashboard/markets/abc123
 * still resolves to "Marchés sélectionnés" rather than falling through to
 * null. Returns the nav item's translation KEY (relative to
 * "Dashboard.Nav") — the caller resolves it with `t(item.label)`. */
function pageTitleKeyFor(pathname: string): string | null {
  const items = [
    DASHBOARD_TOP_ITEM,
    ...POLYMARKET_NAV_ITEMS,
    SPORTS_TITLE_ITEM,
    ...TRADING_NAV_ITEMS,
    ...DASHBOARD_GLOBAL_ITEMS,
    ...DASHBOARD_RESOURCE_ITEMS,
  ];
  const match = items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? null;
}

function daysRemainingFrom(trialEndsAt: string): number {
  const diffMs = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

type PlanPillTranslator = (key: string, values?: Record<string, number>) => string;

/** Merges the old full-width TrialBanner's "expire dans X jours" copy into
 * this same pill instead of a separate CTA banner — there is no higher paid
 * tier to upsell to (single-tier pricing: discovery trial rolls straight
 * into Pro), so the count is purely informational now, never a button.
 * `t` must be scoped to the "Dashboard.Header.planPill" namespace. */
function planPillLabel(
  t: PlanPillTranslator,
  subscription: SubscriptionRow | null,
  cancelled: boolean,
  trialDaysRemaining: number | null
): string {
  if (!subscription || cancelled) return t("none");
  if (subscription.status === "trialing") {
    if (trialDaysRemaining === null) return t("discovery");
    return trialDaysRemaining > 0
      ? t("discoveryDaysRemaining", { days: trialDaysRemaining })
      : t("discoveryLastDay");
  }
  if (subscription.status === "past_due") return t("pastDue");
  return t("pro");
}

export function DashboardHeader({
  menuOpen,
  onMenuToggle,
  notifications,
  subscription,
  cancelled,
  trialEndsAt,
  userEmail,
  displayName,
  avatarUrl,
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
  userEmail: string;
  displayName: string;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const t = useTranslations("Dashboard.Header");
  const tNav = useTranslations("Dashboard.Nav");
  const tPlanPill = useTranslations("Dashboard.Header.planPill");
  const pageTitleKey = pageTitleKeyFor(pathname);
  const showBack = pathname !== "/dashboard";

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!trialEndsAt) return;
    const interval = setInterval(() => setTick((tick) => tick + 1), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [trialEndsAt]);
  const trialDaysRemaining = useMemo(() => {
    void tick; // forces the hourly recompute above; not itself part of the result
    return trialEndsAt ? daysRemainingFrom(trialEndsAt) : null;
  }, [trialEndsAt, tick]);

  return (
    <header className="sticky top-0 z-30 flex h-[calc(72px+env(safe-area-inset-top))] items-center justify-between border-b border-dash-border bg-dash-bg/95 pt-[env(safe-area-inset-top)] pr-[calc(1.25rem+env(safe-area-inset-right))] pl-[calc(1.25rem+env(safe-area-inset-left))] backdrop-blur-md lg:h-[72px] lg:px-8 lg:pt-0">
      <div className="flex min-w-0 items-center gap-3">
        {showBack ? (
          <>
            <Link
              href="/dashboard"
              aria-label={t("backAriaLabel")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dash-border bg-dash-surface-alt text-dash-text-secondary transition-colors duration-150 hover:text-dash-text"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            </Link>
            {pageTitleKey && (
              <span className="truncate font-display text-sm font-bold text-dash-text sm:text-base">
                {tNav(pageTitleKey)}
              </span>
            )}
          </>
        ) : (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 lg:hidden"
            aria-label={t("logoAriaLabel")}
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
        <span className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-dash-border bg-dash-surface-alt px-3 py-1.5 text-xs font-semibold text-dash-text-secondary sm:inline-flex">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
          {planPillLabel(tPlanPill, subscription, cancelled, trialDaysRemaining)}
        </span>

        <NotificationsBell notifications={notifications} />

        <ProfileMenu
          displayName={displayName}
          email={userEmail}
          avatarUrl={avatarUrl}
          planLabel={planPillLabel(tPlanPill, subscription, cancelled, trialDaysRemaining)}
        />

        <button
          type="button"
          aria-label={menuOpen ? t("closeMenuAriaLabel") : t("openMenuAriaLabel")}
          aria-expanded={menuOpen}
          onClick={onMenuToggle}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-dash-border bg-dash-surface-alt text-dash-text-secondary transition-transform duration-150 ease-out hover:scale-105 hover:text-dash-text active:scale-95 lg:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
