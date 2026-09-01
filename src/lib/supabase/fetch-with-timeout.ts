/** Supabase's JS client (both @supabase/ssr and @supabase/supabase-js) uses
 * the ambient global `fetch` with no timeout of its own — if Supabase's
 * Auth/PostgREST endpoint is ever slow or unreachable, a call can hang for
 * as long as the platform's own TCP timeout (which can run well past a
 * minute). Every dashboard navigation makes at least two such calls
 * (proxy.ts's refreshSupabaseSession + the layout's getAuthUser, both
 * un-timed-out) — so a single degraded Supabase response turns into every
 * click hanging for 1-2 minutes, with no way for the user to recover by
 * retrying (the retry pays the same uncapped cost).
 *
 * Passed as the `global.fetch` option to createServerClient/
 * createBrowserClient, this bounds every request the client makes so a
 * slow endpoint fails fast instead of hanging the whole page. */
const AUTH_FETCH_TIMEOUT_MS = 8_000;

export function fetchWithTimeout(timeoutMs = AUTH_FETCH_TIMEOUT_MS): typeof fetch {
  return (input, init) =>
    fetch(input, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}
