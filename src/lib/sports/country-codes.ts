/**
 * Pure, client-safe country-name → FlagIcon code lookup — split out of
 * service.ts so Client Components can import it without dragging in
 * lib/supabase/server.ts's next/headers dependency (which breaks the
 * client bundle). service.ts re-exports this for Server Component
 * callers, so both sides use the exact same mapping.
 */

/** English names as returned by API-Sports' `country` field, plus the
 * legacy French labels this module used before real data was connected —
 * kept both so any lingering reference to the old names still resolves. A
 * name with no entry here (a country this module hasn't seen yet) falls
 * back to FlagIcon's own generic-globe rendering — never a crash. */
const COUNTRY_CODE_MAP: Record<string, string> = {
  england: "gb",
  angleterre: "gb",
  spain: "es",
  espagne: "es",
  italy: "it",
  italie: "it",
  germany: "de",
  allemagne: "de",
  france: "fr",
  world: "eu",
  europe: "eu",
  usa: "us",
  "united states": "us",
  "united-states": "us",
};

export function getCountryCode(countryName: string): string | null {
  return COUNTRY_CODE_MAP[countryName.trim().toLowerCase()] ?? null;
}
