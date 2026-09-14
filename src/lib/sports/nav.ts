import { History, Sparkles, Star } from "lucide-react";
import type { DashboardNavItem } from "@/lib/data/dashboard-nav";

/** The "Sport" universe group — mirrors POLYMARKET_NAV_ITEMS (the other
 * universe) in dashboard-nav.ts. "Sélection du jour" is the automated,
 * periodically-refreshed pick list (scan-sport-matches Edge Function),
 * same principle as Polymarket's "Marchés sélectionnés".
 *
 * `label` fields are translation KEYS (relative to the "Dashboard.Nav"
 * namespace), not display text — see the matching comment on
 * DASHBOARD_TOP_ITEM in lib/data/dashboard-nav.ts. */
export const SPORTS_SUB_NAV: DashboardNavItem[] = [
  { label: "sport.analyseIA", href: "/dashboard/sports", icon: Sparkles },
  { label: "sport.selection", href: "/dashboard/sports/selection", icon: Star },
  { label: "sport.mesAnalyses", href: "/dashboard/sports/mes-analyses", icon: History },
];
