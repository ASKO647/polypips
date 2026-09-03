"use client";

import { LayoutDashboard, Sparkles, Trophy, Users, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { findActiveHref } from "@/lib/dashboard-nav-active";
import { cn } from "@/lib/utils";

/** `label` fields here are translation keys (relative to
 * "Dashboard.BottomNav"), resolved with `t(tab.label)` at render time. */
const TABS = [
  { label: "accueil", href: "/dashboard", icon: LayoutDashboard },
  { label: "analyseIA", href: "/dashboard/analyse-ia", icon: Sparkles },
  { label: "sport", href: "/dashboard/sports", icon: Trophy },
  { label: "communaute", href: "/dashboard/community", icon: Users },
] as const;

/**
 * Real bottom tab bar for mobile, not just a hamburger — the dashboard has
 * three separate "universes" (Polymarket/Sport/Trading) plus global tools,
 * too much to fit in 5 tabs, so this surfaces only the busiest entry point
 * per universe plus one global tool, and a trailing "Menu" tab that opens
 * the existing full drawer (DashboardMobileNav) for everything else (Smart
 * Wallet, Trading, Coach IA, Profil, ...).
 */
export function DashboardBottomNav({
  onOpenMenu,
  menuOpen,
}: {
  onOpenMenu: () => void;
  menuOpen: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations("Dashboard.BottomNav");
  const activeHref = findActiveHref(
    pathname,
    TABS.map((tab) => tab.href)
  );
  const menuActive = !menuOpen && activeHref === null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-dash-border bg-dash-bg pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] lg:hidden"
      aria-label={t("ariaLabel")}
    >
      {TABS.map((tab) => {
        const active = tab.href === activeHref;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch
            className={cn(
              "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition-colors duration-150",
              active ? "text-brand-400" : "text-dash-text-tertiary"
            )}
          >
            <tab.icon className="h-5 w-5" strokeWidth={2} />
            <span className="truncate px-1">{t(tab.label)}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={t("menuAriaLabel")}
        aria-expanded={menuOpen}
        className={cn(
          "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition-colors duration-150",
          menuActive || menuOpen ? "text-brand-400" : "text-dash-text-tertiary"
        )}
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
        <span>{t("menu")}</span>
      </button>
    </nav>
  );
}
