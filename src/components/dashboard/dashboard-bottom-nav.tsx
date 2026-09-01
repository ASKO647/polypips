"use client";

import { LayoutDashboard, Sparkles, Trophy, Users, Menu } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { findActiveHref } from "@/lib/dashboard-nav-active";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Accueil", href: "/dashboard", icon: LayoutDashboard },
  { label: "Analyse IA", href: "/dashboard/analyse-ia", icon: Sparkles },
  { label: "Sport", href: "/dashboard/sports", icon: Trophy },
  { label: "Communauté", href: "/dashboard/community", icon: Users },
] as const;

/**
 * Real bottom tab bar for mobile, not just a hamburger — the dashboard has
 * two separate "universes" (Polymarket/Sport) plus global tools, too much
 * to fit in 5 tabs, so this surfaces only the busiest entry point per
 * universe plus one global tool, and a trailing "Menu" tab that opens the
 * existing full drawer (DashboardMobileNav) for everything else (Smart
 * Wallet, Coach IA, Statistiques, Profil, ...).
 */
export function DashboardBottomNav({
  onOpenMenu,
  menuOpen,
}: {
  onOpenMenu: () => void;
  menuOpen: boolean;
}) {
  const pathname = usePathname();
  const activeHref = findActiveHref(
    pathname,
    TABS.map((t) => t.href)
  );
  const menuActive = !menuOpen && activeHref === null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-dash-border bg-dash-bg pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] lg:hidden"
      aria-label="Navigation principale"
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
            <span className="truncate px-1">{tab.label}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Menu"
        aria-expanded={menuOpen}
        className={cn(
          "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition-colors duration-150",
          menuActive || menuOpen ? "text-brand-400" : "text-dash-text-tertiary"
        )}
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
        <span>Menu</span>
      </button>
    </nav>
  );
}
