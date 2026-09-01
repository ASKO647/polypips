import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { fetchWithTimeout } from "@/lib/supabase/fetch-with-timeout";

/**
 * The missing half of the SSR auth setup — server.ts's createClient() can
 * refresh an expired access token (supabase.auth.getUser() rotates it via
 * the refresh token when needed), but a Server Component can't persist that
 * refreshed cookie back to the browser (Next.js only allows cookies.set()
 * from a Route Handler, Server Action, or Middleware — server.ts's setAll()
 * silently swallows the resulting throw). Without this middleware step,
 * every refresh that happens mid-render is immediately discarded: the next
 * request presents the same now-already-rotated refresh token again, which
 * Supabase's rotation-reuse detection rejects outright — the user gets
 * signed out even though nothing about their session was actually invalid.
 * This is far more visible on mobile, where the browser suspends tabs (and
 * the client-side auto-refresh timer with them) much more aggressively than
 * desktop, so the token has usually already expired by the time the app is
 * next used and needs exactly this kind of refresh-on-request.
 *
 * Runs before next-intl's own middleware in proxy.ts — the two are
 * unrelated (this refreshes Supabase cookies, next-intl only reads/writes
 * NEXT_LOCALE) so they don't need to influence each other's response, but
 * this one's refreshed Set-Cookie headers must still reach the browser
 * regardless of whether next-intl's step returns a redirect or a plain
 * pass-through — proxy.ts merges them onto whichever response wins.
 */
export async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: fetchWithTimeout() },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // The actual refresh: getUser() re-validates the JWT and, if it's
  // expired, exchanges the refresh token for a new pair — which triggers
  // the setAll() above, capturing the rotated cookies onto `response`.
  await supabase.auth.getUser();

  return response;
}
