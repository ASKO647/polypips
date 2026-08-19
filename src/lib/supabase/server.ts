import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
            // Called from a Server Component during render — cookies are
            // already refreshed by the auth callback route, so this is safe
            // to ignore.
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
  const cookieStore = await cookies();
  const sbCookieNames = cookieStore.getAll().map((c) => c.name).filter((n) => n.startsWith("sb-"));
  console.error("[DIAG] getAuthUser: sb-* cookies present =", JSON.stringify(sbCookieNames));

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.error("[DIAG] getAuthUser: supabase.auth.getUser() error =", error.message, "| status =", error.status);
  }
  return user;
});
