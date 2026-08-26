/**
 * Navigation data for the Sports module's sidebar sub-list — SPORTS_SUB_NAV
 * below is rendered by SidebarNavContent as the "Sport" universe group's
 * item list, the counterpart to POLYMARKET_NAV_ITEMS in dashboard-nav.ts.
 */
import type { ComponentType } from "react";
import { Compass, Flame, Hand, Star, Swords, Trophy } from "lucide-react";
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

/** The five sports PolyPips covers, in the fixed display order used by
 * every "choose a sport" entry point (SportsMatchesPage's grid, the
 * sidebar's Sport sub-list). active reflects real API-Sports coverage
 * wired into sync-sports-data (see FEATURED_COMPETITIONS there and
 * _shared/api-sports.ts's file comment) — not a UI-only toggle. Tennis is
 * inactive because API-Sports (the account behind API_SPORTS_KEY) doesn't
 * have a tennis product at all — no v1.tennis host exists there. It still
 * appears everywhere a sport is chosen (see SportCategoryPage's honest
 * "bientôt disponible" branch for category.active === false) rather than
 * being hidden, so users see it's coming rather than wondering why it's
 * missing. */
export const SPORT_CATEGORIES: SportCategory[] = [
  { key: "football", label: "Football", active: true },
  { key: "basketball", label: "Basketball", active: true },
  { key: "tennis", label: "Tennis", active: false },
  { key: "rugby", label: "Rugby", active: true },
  { key: "baseball", label: "Baseball", active: true },
];

/** A clearly sport-specific emoji beats a generic/arbitrary lucide icon —
 * every SportKey has one here, including tennis, so the mapping is ready
 * the moment a real tennis data source exists. That's separate from
 * SPORT_CATEGORIES' `active` flag, which is what gates whether a sport has
 * real competitions/matches behind it — see ACTIVE_SPORT_CATEGORIES below. */
export const SPORT_EMOJIS: Record<SportKey, string> = {
  football: "⚽",
  basketball: "🏀",
  tennis: "🎾",
  rugby: "🏉",
  baseball: "⚾",
};

/** Filters/quick-selectors over lists of real matches or competitions
 * (Overview's quick filters, the Compétitions/Opportunités pickers, the
 * filters drawer) render from this — filtering to a sport with no real
 * data would just show an unexplained empty list. "Choose your sport"
 * entry points (SportsMatchesPage, the sidebar's Sport sub-list) render
 * from the full SPORT_CATEGORIES instead, since those already have an
 * honest "bientôt disponible" destination for an inactive sport. */
export const ACTIVE_SPORT_CATEGORIES: SportCategory[] = SPORT_CATEGORIES.filter((s) => s.active);

export function getSportCategory(key: string): SportCategory | undefined {
  return SPORT_CATEGORIES.find((s) => s.key === key);
}
