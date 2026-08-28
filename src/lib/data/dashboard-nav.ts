import {
  Activity,
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
 * Smart Money is deliberately not its own entry anymore: its wallet
 * browsing/following/detail view now lives at the top of Copy Trading
 * (an address-lookup search, see WalletLookupPanel) instead of a separate
 * page — one place to find a wallet and one place to act on it. */
export const POLYMARKET_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Analyse IA", href: "/dashboard/analyse-ia", icon: Sparkles },
  { label: "Marchés sélectionnés", href: "/dashboard/markets", icon: LineChart },
  { label: "Copy Trading", href: "/dashboard/copy-trading", icon: Copy },
  { label: "Mes trades copiés", href: "/dashboard/copy-trading/positions", icon: ListChecks },
];

/** The "Fomo X Axiom" universe group — Fomo/Axiom-sourced memecoin wallets,
 * their own Analyse IA (one page per source, unlike Polymarket's single
 * "Analyse IA" — see analyze-signal-bet), and their own Copy Trading
 * pipeline (AI Engine + Risk Engine gating a notification — never an
 * executed order, exactly like Polymarket's own Copy Trading; see
 * sync-signal-wallets' file comment). A third universe alongside Polymarket
 * and Sport, deliberately not folded into POLYMARKET_NAV_ITEMS: different
 * chain (Solana), different asset class (SPL tokens), no official
 * Fomo/Axiom API to build an address-lookup search on the way Polymarket's
 * Copy Trading has one.
 *
 * "Smart Wallet" isn't its own entry anymore — its browse/filter/follow
 * grid now lives at the top of the Copy Trading page (still
 * /dashboard/smart-wallets/suivis, unchanged) instead of a separate one;
 * see SignalCopyTradingFlow's own comment. Routes otherwise stay under
 * /dashboard/smart-wallets/* (unchanged from before this rename) so
 * existing links — including ones already generated into notification
 * rows by sync-signal-wallets — keep resolving; only the labels/grouping
 * shown to the user changed here. */
export const SIGNAL_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Analyse AI Fomo", href: "/dashboard/smart-wallets/analyse-fomo", icon: Sparkles },
  { label: "Analyse AI Axiom", href: "/dashboard/smart-wallets/analyse-axiom", icon: Sparkles },
  { label: "Copy Trading", href: "/dashboard/smart-wallets/suivis", icon: Wallet },
  { label: "Mes trades copiés", href: "/dashboard/smart-wallets/positions", icon: Copy },
  {
    label: "Comment ça marche",
    href: "/dashboard/smart-wallets/comment-ca-marche",
    icon: BookOpen,
  },
];

/** Global tools that aren't specific to either universe — Coach IA answers
 * questions about analyses from both, Statistiques tracks performance
 * across both. Pips Tracks lives here too (not under Fomo X Axiom
 * anymore): its feed spans Fomo/Axiom/News/Signal IA sources, which
 * isn't a single-universe concern any more than Communauté is — the URL
 * stays under /dashboard/smart-wallets/pips-tracks unchanged so no link
 * (including any already generated one) breaks; only where it's grouped
 * in the sidebar changed. */
export const DASHBOARD_GLOBAL_ITEMS: DashboardNavItem[] = [
  { label: "Pips Tracks", href: "/dashboard/smart-wallets/pips-tracks", icon: Activity },
  { label: "Coach IA", href: "/dashboard/coach", icon: GraduationCap },
  { label: "Statistiques", href: "/dashboard/stats", icon: BarChart3 },
  // Groups/chat aren't scoped to Polymarket, Sport, or Fomo X Axiom — a
  // user's community can span any/all of those interests, so this lives
  // alongside Coach IA/Statistiques rather than inside one universe group.
  { label: "Communauté", href: "/dashboard/community", icon: Users },
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
