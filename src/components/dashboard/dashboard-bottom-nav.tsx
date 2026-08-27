"use client";

import { LayoutDashboard, Menu, Sparkles, Trophy, Wallet } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { findActiveHref } from "@/lib/dashboard-nav-active";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Accueil", href: "/dashboard", icon: LayoutDashboard },
  { label: "Analyse IA", href: "/dashboard/analyse-ia", icon: Sparkles },
  { label: "Sport", href: "/dashboard/sports", icon: Trophy },
  { label: "Fomo/Axiom", href: "/dashboard/smart-wallets", icon: Wallet },
] as const;

/**
 * Real bottom tab bar for mobile, not just a hamburger — the dashboard has
 * three separate "universes" (Polymarket/Sport/Fomo X Axiom) plus global
 * tools, too much to fit in 5 tabs, so this surfaces only the busiest entry
 * point per universe and a trailing "Menu" tab that opens the existing full
 * drawer (DashboardMobileNav) for everything else (Copy Trading, Coach IA,
 * Statistiques, Paramètres, ...).
 *
 * "Fomo/Axiom" points at /dashboard/smart-wallets (a route prefix, not a
 * page of its own) purely so findActiveHref can group all of that
 * universe's sub-routes under one tab; Link still needs a real destination,
 * so it targets the Analyse IA Fomo page — the same "first tab" pattern the
 * sidebar's own group header doesn't need but this flat tab bar does.
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
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-[#160b0c] pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] lg:hidden"
      aria-label="Navigation principale"
    >
      {TABS.map((tab) => {
        const active = tab.href === activeHref;
        const linkHref = tab.href === "/dashboard/smart-wallets" ? "/dashboard/smart-wallets/analyse-fomo" : tab.href;
        return (
          <Link
            key={tab.href}
            href={linkHref}
            prefetch
            className={cn(
              "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition-colors duration-150",
              active ? "text-brand-400" : "text-white/50"
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
          menuActive || menuOpen ? "text-brand-400" : "text-white/50"
        )}
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
        <span>Menu</span>
      </button>
    </nav>
  );
}
