/**
 * Navigation data for the Sports module's sidebar sub-list — rendered by
 * SidebarNavContent under the "Sports" item, same convention as
 * DASHBOARD_NAV_ITEMS/DASHBOARD_RESOURCE_ITEMS in dashboard-nav.ts.
 */
import type { ComponentType } from "react";
import {
  Bike,
  CircleDot,
  Compass,
  Dumbbell,
  Flame,
  Goal,
  Hand,
  Star,
  Swords,
  Trophy,
  Volleyball,
} from "lucide-react";
import type { SportCategory, SportKey } from "./types";

export type SportsSubNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
};

export const SPORTS_SUB_NAV: SportsSubNavItem[] = [
  { label: "Overview", href: "/dashboard/sports", icon: Compass },
  { label: "Opportunités", href: "/dashboard/sports/opportunites", icon: Flame },
  { label: "Matches", href: "/dashboard/sports/matches", icon: Trophy },
  { label: "Mes matchs", href: "/dashboard/sports/mes-matchs", icon: Star },
  { label: "Mes équipes", href: "/dashboard/sports/mes-equipes", icon: Hand },
  { label: "Compétitions", href: "/dashboard/sports/competitions", icon: Swords },
];

/** active reflects real API-Sports coverage wired into sync-sports-data
 * (see SPORT_COMPETITIONS there and _shared/api-sports.ts's file comment)
 * — not a UI-only toggle. Tennis and boxe are inactive because API-Sports
 * (the account behind API_SPORTS_KEY) doesn't have a product for either
 * sport at all, not because of a scope decision on this end. MMA's API
 * does exist (v1.mma.api-sports.io) but models fighters/fights, not
 * team-vs-team matches, so it doesn't fit this module's home/away Match
 * shape without real changes — left inactive for the same reason, deferred
 * rather than unsupported. */
export const SPORT_CATEGORIES: SportCategory[] = [
  { key: "football", label: "Football", active: true },
  { key: "basketball", label: "Basketball", active: true },
  { key: "tennis", label: "Tennis", active: false },
  { key: "nfl", label: "NFL", active: true },
  { key: "rugby", label: "Rugby", active: true },
  { key: "hockey", label: "Hockey", active: true },
  { key: "mma", label: "MMA", active: false },
  { key: "boxe", label: "Boxe", active: false },
  { key: "baseball", label: "Baseball", active: true },
];

export const SPORT_ICONS: Record<SportKey, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  football: Goal,
  basketball: CircleDot,
  tennis: Volleyball,
  nfl: Trophy,
  rugby: Swords,
  hockey: Bike,
  mma: Dumbbell,
  boxe: Hand,
  baseball: CircleDot,
};

export function getSportCategory(key: string): SportCategory | undefined {
  return SPORT_CATEGORIES.find((s) => s.key === key);
}
