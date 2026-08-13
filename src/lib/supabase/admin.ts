import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client that bypasses RLS. Only ever used server-side by the
 * Stripe webhook route, which is the sole writer to public.subscriptions.
 * Never import this from client components or from code reachable by a
 * user-supplied request without its own auth check.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
