import {
  BarChart3,
  Copy,
  GraduationCap,
  LineChart,
  Settings,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { ComponentType } from "react";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Analyse IA", href: "/dashboard", icon: Sparkles },
  { label: "Marchés sélectionnés", href: "/dashboard/markets", icon: LineChart },
  { label: "Smart Money", href: "/dashboard/smart-money", icon: Wallet },
  { label: "Copy Trading", href: "/dashboard/copy-trading", icon: Copy },
  { label: "Coach IA", href: "/dashboard/coach", icon: GraduationCap },
  { label: "Statistiques", href: "/dashboard/stats", icon: BarChart3 },
  { label: "Paramètres", href: "/dashboard/settings", icon: Settings },
];
