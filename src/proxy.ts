import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";

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
 * It now ALSO refreshes the Supabase session (see
 * lib/supabase/middleware.ts) on every matched request — without this, an
 * expired access token can never actually get renewed (Server Components
 * can't persist cookies), which was silently logging users out, especially
 * on mobile where backgrounded tabs let the token expire far more often.
 * The two steps are independent (one only touches Supabase's sb-* cookies,
 * the other only touches NEXT_LOCALE), so the Supabase refresh runs first
 * and its Set-Cookie headers are merged onto whichever response next-intl
 * ultimately returns — a redirect (bare path → locale-prefixed) or a plain
 * pass-through — so a refreshed session survives either outcome.
 *
 * /auth/callback is excluded on purpose: it's the fixed OAuth redirect URI
 * registered with Google/Supabase (see google-auth-button.tsx /
 * signup-form.tsx) and must never gain a locale prefix, or the provider's
 * registered callback URL would stop matching. /api is excluded because
 * route handlers have no notion of locale at all — each one already calls
 * lib/supabase/server.ts's createClient() itself, which still refreshes
 * the session for that single request even without this middleware step,
 * so excluding /api here doesn't reintroduce the logout bug for API calls.
 * The owner console path is excluded for the same reason as /api — it's a
 * single-person internal tool outside [locale], not a page next-intl
 * should ever redirect or localize — and letting it through here would
 * also mean an unauthorized visitor's request to that path gets touched
 * (and its shape logged) by this middleware before ever reaching the
 * route's own auth check. /i is excluded for the same "no [locale]
 * segment, must resolve its own redirect" reason as /auth/callback — see
 * src/app/i/[slug]/route.ts — it's the short link handed to influencers
 * and needs to stay short (/i/slug, never /fr/i/slug).
 *
 * The matcher below must be a statically-analyzable literal (Next.js
 * parses it at build time, a computed string fails the build) — so the
 * owner segment is inlined here rather than imported from
 * src/lib/owner-path.ts. If that path ever changes, this literal must be
 * updated to match by hand.
 */
const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const sessionResponse = await refreshSupabaseSession(request);
  const intlResponse = intlMiddleware(request);

  sessionResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie);
  });

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|auth/callback|ctrl-9f4k2q7x|i/|_next|_vercel|.*\\..*).*)"],
};
