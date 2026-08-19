import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

/**
 * Named/located per Next.js 16's rename of middleware.ts → proxy.ts (the
 * old filename is only kept for edge-runtime backward compat and, as of
 * 16.2+, Next stops looking for it by default — using the old name here
 * would make locale routing silently do nothing). This still handles the
 * exact same job next-intl's middleware always has: locale detection
 * (NEXT_LOCALE cookie → Accept-Language → routing.defaultLocale),
 * redirecting bare paths to their locale-prefixed equivalent, and setting
 * the cookie once a locale is chosen so it persists across visits.
 *
 * /auth/callback is excluded on purpose: it's the fixed OAuth redirect URI
 * registered with Google/Supabase (see google-auth-button.tsx /
 * signup-form.tsx) and must never gain a locale prefix, or the provider's
 * registered callback URL would stop matching. /api is excluded because
 * route handlers have no notion of locale at all. The owner console path
 * is excluded for the same reason as /api — it's a single-person internal
 * tool outside [locale], not a page next-intl should ever redirect or
 * localize — and letting it through here would also mean an unauthorized
 * visitor's request to that path gets touched (and its shape logged) by
 * this middleware before ever reaching the route's own auth check.
 *
 * The matcher below must be a statically-analyzable literal (Next.js
 * parses it at build time, a computed string fails the build) — so the
 * owner segment is inlined here rather than imported from
 * src/lib/owner-path.ts. If that path ever changes, this literal must be
 * updated to match by hand.
 */
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|auth/callback|ctrl-9f4k2q7x|_next|_vercel|.*\\..*).*)"],
};
