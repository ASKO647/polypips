import {
  BarChart3,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  Sparkles,
  Trophy,
  User,
  Users,
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
 * their own collapsible section in SidebarNavContent.
 *
 * "Smart Wallet" (still at /dashboard/copy-trading, unchanged URL) is a
 * manual address search + follow/unfollow + new-position notifications —
 * no automated copy-trading/strategy pipeline anymore (that whole engine,
 * budget/risk-level config included, was removed; see
 * smart-wallet-flow.tsx). */
export const POLYMARKET_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Analyse IA", href: "/dashboard/analyse-ia", icon: Sparkles },
  { label: "Marchés sélectionnés", href: "/dashboard/markets", icon: LineChart },
  { label: "Smart Wallet", href: "/dashboard/copy-trading", icon: Wallet },
];

/** Global tools that aren't specific to either universe — Coach IA answers
 * questions about analyses from both, Statistiques tracks performance
 * across both. Profil (still at /dashboard/settings — same URL Stripe
 * checkout already redirects back to) is here too, as a normal sidebar
 * entry rather than tucked into a header-only menu, so it participates in
 * the sidebar's own active-link matching like every other section. */
export const DASHBOARD_GLOBAL_ITEMS: DashboardNavItem[] = [
  { label: "Coach IA", href: "/dashboard/coach", icon: GraduationCap },
  { label: "Statistiques", href: "/dashboard/stats", icon: BarChart3 },
  // Groups/chat aren't scoped to Polymarket or Sport — a user's community
  // can span either interest, so this lives alongside Coach IA/
  // Statistiques rather than inside one universe group.
  { label: "Communauté", href: "/dashboard/community", icon: Users },
  { label: "Profil", href: "/dashboard/settings", icon: User },
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

/** Header-menu-only entries — Profil moved into DASHBOARD_GLOBAL_ITEMS
 * (a real sidebar section now, see its own comment), so only FAQ/Support
 * is left here. Still feeds DashboardHeader's title lookup. */
export const DASHBOARD_RESOURCE_ITEMS: DashboardNavItem[] = [
  { label: "FAQ / Support", href: "/support", icon: LifeBuoy },
];
