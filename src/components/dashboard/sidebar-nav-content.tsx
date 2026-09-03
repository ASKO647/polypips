"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ChevronDown, Plus } from "lucide-react";
import { AccountStatusCard } from "@/components/dashboard/account-status-card";
import {
  DASHBOARD_GLOBAL_ITEMS,
  DASHBOARD_TOP_ITEM,
  POLYMARKET_NAV_ITEMS,
  TRADING_NAV_ITEMS,
  type DashboardNavItem,
} from "@/lib/data/dashboard-nav";
import { SPORTS_SUB_NAV } from "@/lib/sports/nav";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";
import { findActiveHref } from "@/lib/dashboard-nav-active";
import { cn } from "@/lib/utils";

/** The dashboard has three distinct "universes" — Polymarket (prediction
 * markets), Sport (real-world sports analysis), and Trading (chart
 * screenshot analysis) — each rendered as its own collapsible sidebar
 * group with a clearly different accent color, so a user always knows
 * which product they're in. Tableau de bord/Coach IA/Communauté/Profil
 * aren't scoped to any one and stay outside all three groups. */
type UniverseGroup = {
  id: string;
  label: string;
  accentClass: string;
  badge?: string;
  items: DashboardNavItem[];
};

export function SidebarNavContent({
  subscription,
  onNavigate,
}: {
  subscription: SubscriptionRow | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations("Dashboard.Nav");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) =>
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const activeHref = findActiveHref(pathname, [
    DASHBOARD_TOP_ITEM.href,
    ...POLYMARKET_NAV_ITEMS.map((i) => i.href),
    ...SPORTS_SUB_NAV.map((i) => i.href),
    ...TRADING_NAV_ITEMS.map((i) => i.href),
    ...DASHBOARD_GLOBAL_ITEMS.map((i) => i.href),
  ]);

  const renderLink = (item: DashboardNavItem) => {
    const active = item.href === activeHref;

    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
          active
            ? "bg-brand-500/15 text-brand-400"
            : "text-dash-text-secondary hover:bg-dash-surface-hover hover:text-dash-text"
        )}
      >
        <item.icon
          className={cn("h-[18px] w-[18px] shrink-0", active && "text-brand-400")}
          strokeWidth={2}
        />
        <span className="flex-1">{t(item.label)}</span>
        {item.badge && (
          <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const renderUniverseGroup = (group: UniverseGroup, extra?: React.ReactNode) => {
    const collapsed = collapsedGroups[group.id];
    const groupActive = group.items.some(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    );

    return (
      <div key={group.id} className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => toggleGroup(group.id)}
          aria-expanded={!collapsed}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors duration-150 hover:bg-dash-surface-hover"
        >
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", group.accentClass)} />
          <span
            className={cn(
              "flex-1 text-[11px] font-bold uppercase tracking-wide",
              groupActive ? "text-dash-text" : "text-dash-text-quaternary"
            )}
          >
            {group.label}
          </span>
          {group.badge && (
            <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {group.badge}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-dash-text-quaternary transition-transform duration-150",
              collapsed && "-rotate-90"
            )}
            strokeWidth={2.5}
          />
        </button>

        {!collapsed && (
          <div className="flex flex-col gap-0.5">
            {group.items.map(renderLink)}
            {extra}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <nav className="flex flex-1 flex-col gap-4 px-4 py-2">
        {renderLink(DASHBOARD_TOP_ITEM)}

        <div className="flex flex-col gap-4">
          {renderUniverseGroup({
            id: "polymarket",
            label: t("polymarket.groupLabel"),
            accentClass: "bg-violet-400",
            items: POLYMARKET_NAV_ITEMS,
          })}

          {renderUniverseGroup({
            id: "sport",
            label: t("sport.groupLabel"),
            accentClass: "bg-emerald-400",
            items: SPORTS_SUB_NAV,
          })}

          {renderUniverseGroup({
            id: "trading",
            label: t("trading.groupLabel"),
            accentClass: "bg-amber-400",
            badge: t("trading.badge"),
            items: TRADING_NAV_ITEMS,
          })}
        </div>

        <div className="flex flex-col gap-0.5">{DASHBOARD_GLOBAL_ITEMS.map(renderLink)}</div>
      </nav>

      <div className="flex flex-col gap-3 px-4 pb-4">
        <AccountStatusCard subscription={subscription} />
        <Link
          href="/dashboard/analyse-ia"
          onClick={onNavigate}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-dash-border-strong text-sm font-semibold text-dash-text-secondary transition-colors hover:border-dash-text-quaternary hover:text-dash-text"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {t("newAnalysis")}
        </Link>
      </div>
    </>
  );
}
