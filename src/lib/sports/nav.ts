/**
 * Navigation data for the Sports module's sidebar sub-list — SPORTS_SUB_NAV
 * below is rendered by SidebarNavContent as the "Sport" universe group's
 * item list, the counterpart to POLYMARKET_NAV_ITEMS in dashboard-nav.ts.
 */
import type { ComponentType } from "react";
import { Compass, Swords, Trophy } from "lucide-react";
import type { SportCategory, SportKey } from "./types";

export type SportsSubNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
};

export const SPORTS_SUB_NAV: SportsSubNavItem[] = [
  { label: "Overview", href: "/dashboard/sports", icon: Compass },
  { label: "Matches", href: "/dashboard/sports/matches", icon: Trophy },
  { label: "Compétitions", href: "/dashboard/sports/competitions", icon: Swords },
];

/** The sports PolyPips covers, in the fixed display order used by every
 * "choose a sport" entry point (SportsMatchesPage's grid, the sidebar's
 * Sport sub-list). active reflects real data-source coverage — team sports
 * via API-Sports (sync-sports-data, FEATURED_COMPETITIONS there and
 * _shared/api-sports.ts's file comment), individual-athlete sports
 * (tennis/boxing/MMA) via The Odds API (sync-individual-sports-data,
 * _shared/odds-api.ts) — not a UI-only toggle. All seven are active: every
 * one of them has a confirmed real data source behind it as of
 * 2026-08-27/28 (tennis's tennis_* sport_keys, and boxing_boxing /
 * mma_mixed_martial_arts confirmed present+active on this account's own
 * plan before being wired in). */
export const SPORT_CATEGORIES: SportCategory[] = [
  { key: "football", label: "Football", active: true },
  { key: "basketball", label: "Basketball", active: true },
  { key: "tennis", label: "Tennis", active: true },
  { key: "rugby", label: "Rugby", active: true },
  { key: "baseball", label: "Baseball", active: true },
  { key: "boxing", label: "Boxe", active: true },
  { key: "mma", label: "MMA", active: true },
];

/** A clearly sport-specific emoji beats a generic/arbitrary lucide icon —
 * every SportKey has one here. That's separate from SPORT_CATEGORIES'
 * `active` flag, which is what gates whether a sport has real competitions/
 * matches behind it — see ACTIVE_SPORT_CATEGORIES below. */
export const SPORT_EMOJIS: Record<SportKey, string> = {
  football: "⚽",
  basketball: "🏀",
  tennis: "🎾",
  rugby: "🏉",
  baseball: "⚾",
  boxing: "🥊",
  mma: "🥋",
};

/** Tennis/boxing/MMA are individual-athlete sports (one player/fighter vs
 * another, not a team) — lib/sports/service.ts branches on this to read
 * from odds_api_competitions_cache/odds_api_matches_cache instead of the
 * team-sport sports_*_cache tables. Also used by CompetitionBrowser and
 * CompetitionMatches to show a circuit badge (🎾/🥊/🥋) instead of a
 * country flag, since these sports aren't organized by country. */
export const INDIVIDUAL_SPORT_KEYS: ReadonlySet<SportKey> = new Set(["tennis", "boxing", "mma"]);

export function isIndividualSport(sport: SportKey): boolean {
  return INDIVIDUAL_SPORT_KEYS.has(sport);
}

/** Emoji shown next to a competition's circuit grouping label (ATP / WTA /
 * ITF / Tennis / Boxe / MMA) in place of a country flag — these sports
 * don't organize by country, so lib/sports/service.ts stores the circuit
 * label directly in Competition.country (see that file's comment) and the
 * UI renders this instead of attempting a flag lookup for it. Returns null
 * for anything else, so a real country string still renders its normal
 * flag. */
export function circuitEmoji(label: string): string | null {
  if (label === "ATP" || label === "WTA" || label === "ITF" || label === "Tennis") return "🎾";
  if (label === "Boxe") return "🥊";
  if (label === "MMA") return "🥋";
  return null;
}

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
