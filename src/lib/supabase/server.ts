import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { fetchWithTimeout } from "@/lib/supabase/fetch-with-timeout";

/** React's cache() memoizes per request in the App Router — every Server
 * Component in a single render pass (the dashboard layout plus whichever
 * page it wraps) that calls createClient() gets back the exact same client
 * instance instead of constructing a fresh one from cookies() each time.
 * On its own this doesn't dedupe network calls (see getAuthUser below for
 * that), but it's the prerequisite: getAuthUser can only reuse a single
 * in-flight getUser() call across the layout and the page if they're both
 * working with the *same* client object. */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: fetchWithTimeout() },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components can't persist cookies (this only succeeds
            // from a Route Handler or Server Action) — safe to ignore here
            // because proxy.ts's refreshSupabaseSession() already refreshes
            // the token (and persists the rotated cookie) in middleware,
            // before the request ever reaches a Server Component. Without
            // that middleware step, this catch would silently discard every
            // mid-render refresh instead — see lib/supabase/middleware.ts's
            // file comment for the "random logout" bug that caused.
          }
        },
      },
    }
  );
});

/** Every dashboard page.tsx used to call supabase.auth.getUser() itself —
 * on top of the dashboard layout ALSO calling it, and fetchSubscription()
 * calling it a third time — meaning a single page navigation triggered 2-3
 * separate network round-trips to Supabase's Auth server just to answer
 * "who is this?" before any real data fetching even started. getUser() (not
 * getSession()) is deliberately used here since it revalidates the JWT
 * against Supabase rather than trusting an unverified cookie — cache()
 * keeps that security property while only paying its network cost once per
 * request. */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
