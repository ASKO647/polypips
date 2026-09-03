import { History, Sparkles } from "lucide-react";
import type { DashboardNavItem } from "@/lib/data/dashboard-nav";

/** The "Sport" universe group — mirrors POLYMARKET_NAV_ITEMS (the other
 * universe) in dashboard-nav.ts. Deliberately just two flat items now: the
 * old expandable per-sport-category sub-list (Football/Basketball/Tennis/
 * Rugby/...) is gone along with the whole browse-everything Sport UI it
 * belonged to.
 *
 * `label` fields are translation KEYS (relative to the "Dashboard.Nav"
 * namespace), not display text — see the matching comment on
 * DASHBOARD_TOP_ITEM in lib/data/dashboard-nav.ts. */
export const SPORTS_SUB_NAV: DashboardNavItem[] = [
  { label: "sport.analyseIA", href: "/dashboard/sports", icon: Sparkles },
  { label: "sport.mesAnalyses", href: "/dashboard/sports/mes-analyses", icon: History },
];
