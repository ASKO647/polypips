import { defineRouting } from "next-intl/routing";

/**
 * Two locales, no per-locale URL slug translation (routing.pathnames is
 * intentionally omitted — /pricing stays /pricing in both locales, only
 * the /fr or /en prefix and the rendered content change). defaultLocale
 * is what the middleware falls back to for a first-time visitor with no
 * NEXT_LOCALE cookie and no matching Accept-Language header.
 */
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
});

export type AppLocale = (typeof routing.locales)[number];
