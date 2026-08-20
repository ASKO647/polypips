import {
  BarChart3,
  Copy,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
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

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Analyse IA", href: "/dashboard/analyse-ia", icon: Sparkles },
  { label: "Marchés sélectionnés", href: "/dashboard/markets", icon: LineChart },
  { label: "Sports", href: "/dashboard/sports", icon: Trophy, badge: "NOUVEAU" },
  { label: "Smart Money", href: "/dashboard/smart-money", icon: Wallet },
  { label: "Copy Trading", href: "/dashboard/copy-trading", icon: Copy },
  { label: "Coach IA", href: "/dashboard/coach", icon: GraduationCap },
  { label: "Statistiques", href: "/dashboard/stats", icon: BarChart3 },
];

export const DASHBOARD_RESOURCE_ITEMS: DashboardNavItem[] = [
  { label: "Paramètres", href: "/dashboard/settings", icon: Settings },
  { label: "FAQ / Support", href: "/support", icon: LifeBuoy },
];
