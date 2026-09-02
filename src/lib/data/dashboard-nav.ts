import {
  CandlestickChart,
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

/** The "Trading" universe group — a third product domain alongside
 * Polymarket and Sport, same collapsible-group pattern (own accent color
 * in SidebarNavContent). Single item for now (chart screenshot → AI
 * recommendation); no "Mes analyses" browsing page was requested this
 * round, unlike Sport's — trading_chart_analyses still persists every
 * result (quota counting needs it regardless), just nothing reads it back
 * yet beyond the single most recent one on the page itself. */
export const TRADING_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Analyse IA", href: "/dashboard/trading", icon: CandlestickChart },
];

/** Global tools that aren't specific to any universe — Coach IA answers
 * questions about analyses from all three, and Communauté/Profil aren't
 * scoped to a single product domain either. Statistiques used to live
 * here too; removed as its own page (product decision) — its one still-
 * live consumer, the dashboard overview's PerformanceCard, keeps reading
 * lib/supabase/performance.ts directly, untouched by that removal.
 * Profil (still at /dashboard/settings — same URL Stripe checkout already
 * redirects back to) is a normal sidebar entry rather than tucked into a
 * header-only menu, so it participates in the sidebar's own active-link
 * matching like every other section. */
export const DASHBOARD_GLOBAL_ITEMS: DashboardNavItem[] = [
  { label: "Coach IA", href: "/dashboard/coach", icon: GraduationCap },
  // Groups/chat aren't scoped to any one universe — a user's community can
  // span several interests, so this lives here rather than inside one
  // universe group.
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
