import type { SupabaseClient } from "@supabase/supabase-js";
import type { LandingAttribution } from "@/lib/attribution/capture";

/**
 * Writes the visitor's first-touch attribution (captured client-side at
 * landing — see lib/attribution/capture.ts) into signup_sources once a
 * signup actually completes. Called from both places a brand-new
 * Supabase Auth user can be created: the immediate-session branch of
 * signup-form.tsx (email/password with email confirmation disabled) and
 * /auth/callback (Google OAuth, and email/password once the confirmation
 * link is clicked).
 *
 * user_id is signup_sources' primary key, so a second call for the same
 * user — a re-clicked confirmation email, or an existing user logging
 * back in via Google, which also flows through /auth/callback — is a
 * harmless no-op via ignoreDuplicates rather than an error or an
 * overwrite of the original source.
 */
export async function recordSignupSource(
  supabase: SupabaseClient,
  userId: string,
  attribution: LandingAttribution
): Promise<void> {
  const { error } = await supabase.from("signup_sources").upsert(
    {
      user_id: userId,
      utm_source: attribution.source,
      utm_medium: attribution.medium,
      utm_campaign: attribution.campaign,
      landing_path: attribution.landingPath,
    },
    { onConflict: "user_id", ignoreDuplicates: true }
  );
  if (error) {
    console.error("[signup-sources] failed to record attribution", error);
  }
}
