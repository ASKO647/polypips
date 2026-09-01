import { History, Sparkles } from "lucide-react";
import type { DashboardNavItem } from "@/lib/data/dashboard-nav";

/** The "Sport" universe group — mirrors POLYMARKET_NAV_ITEMS (the other
 * universe) in dashboard-nav.ts. Deliberately just two flat items now: the
 * old expandable per-sport-category sub-list (Football/Basketball/Tennis/
 * Rugby/...) is gone along with the whole browse-everything Sport UI it
 * belonged to. */
export const SPORTS_SUB_NAV: DashboardNavItem[] = [
  { label: "Analyse IA", href: "/dashboard/sports", icon: Sparkles },
  { label: "Mes analyses", href: "/dashboard/sports/mes-analyses", icon: History },
];
