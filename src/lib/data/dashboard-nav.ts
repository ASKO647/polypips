import {
  BarChart3,
  BookOpen,
  Copy,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  ListChecks,
  Settings,
  Sparkles,
  Trophy,
  Wallet,
} from "lucide-react";
import type { ComponentType } from "react";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Short pill shown after the label — e.g. "NOUVEAU" on a freshly
   * launched section. Remove once the section isn't new anymore rather
   * than leaving a stale badge. */
  badge?: string;
};

/** Entry point shown above both universe groups — not itself scoped to
 * either Polymarket or Sport. */
export const DASHBOARD_TOP_ITEM: DashboardNavItem = {
  label: "Tableau de bord",
  href: "/dashboard",
  icon: LayoutDashboard,
};

/** The "Polymarket" universe group — everything here operates on real
 * Polymarket markets. Mirrors the Sport group (SPORTS_SUB_NAV in
 * lib/sports/nav.ts), which is the other universe; both are rendered as
 * their own collapsible section in SidebarNavContent. */
export const POLYMARKET_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Analyse IA", href: "/dashboard/analyse-ia", icon: Sparkles },
  { label: "Marchés sélectionnés", href: "/dashboard/markets", icon: LineChart },
  { label: "Smart Money", href: "/dashboard/smart-money", icon: Wallet },
  { label: "Copy Trading", href: "/dashboard/copy-trading", icon: Copy },
];

/** The "Fomo X Axiom" universe group — Fomo/Axiom-sourced memecoin wallets,
 * their own Analyse IA (one page per source, unlike Polymarket's single
 * "Analyse IA" — see analyze-signal-bet), and their own Copy Trading
 * pipeline. A third universe alongside Polymarket and Sport, deliberately
 * not folded into POLYMARKET_NAV_ITEMS: different chain (Solana), different
 * asset class (SPL tokens), different Copy Trading semantics (AI Engine +
 * Risk Engine + demo Execution Engine, not suggestion-only) — see the
 * 20260827090000 migration's file comment. Routes stay under
 * /dashboard/smart-wallets/* (unchanged from before this rename) so
 * existing links — including ones already generated into notification
 * rows by sync-signal-wallets — keep resolving; only the labels/grouping
 * shown to the user changed here. */
export const SIGNAL_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Analyse AI Fomo", href: "/dashboard/smart-wallets/analyse-fomo", icon: Sparkles },
  { label: "Analyse AI Axiom", href: "/dashboard/smart-wallets/analyse-axiom", icon: Sparkles },
  { label: "Smart Wallet", href: "/dashboard/smart-wallets", icon: Wallet },
  { label: "Mes Smart Wallets", href: "/dashboard/smart-wallets/suivis", icon: ListChecks },
  { label: "Trades copiés", href: "/dashboard/smart-wallets/positions", icon: Copy },
  {
    label: "Comment connecter PolyPips à Fomo & Axiom",
    href: "/dashboard/smart-wallets/tutoriel",
    icon: BookOpen,
  },
];

/** Global tools that aren't specific to either universe — Coach IA answers
 * questions about analyses from both, Statistiques tracks performance
 * across both. */
export const DASHBOARD_GLOBAL_ITEMS: DashboardNavItem[] = [
  { label: "Coach IA", href: "/dashboard/coach", icon: GraduationCap },
  { label: "Statistiques", href: "/dashboard/stats", icon: BarChart3 },
];

/** Not rendered directly in the sidebar — the Sport universe group
 * (SPORTS_SUB_NAV in lib/sports/nav.ts) replaces it there — but kept here
 * so DashboardHeader's title lookup still resolves every
 * /dashboard/sports/* route to a single "Sports" title, exactly like it
 * did before the sidebar restructure (every sports sub-page shared one
 * title; each Polymarket item still resolves to its own specific label). */
export const SPORTS_TITLE_ITEM: DashboardNavItem = {
  label: "Sports",
  href: "/dashboard/sports",
  icon: Trophy,
};

export const DASHBOARD_RESOURCE_ITEMS: DashboardNavItem[] = [
  { label: "Paramètres", href: "/dashboard/settings", icon: Settings },
  { label: "FAQ / Support", href: "/support", icon: LifeBuoy },
];
