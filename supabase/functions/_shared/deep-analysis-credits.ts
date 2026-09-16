import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Server-side credit gating for "Analyse Approfondie" — shared by
 * analyze-market, analyze-sport-match and analyze-trading-chart so the
 * atomic-consume / refund-on-failure logic exists exactly once.
 *
 * Both RPCs are SECURITY DEFINER, granted to service_role ONLY (see the
 * credits system migration) — a plain authenticated user can never call
 * them directly, so this module always goes through a service-role
 * client, never the caller's own JWT-scoped one. `userId` must always
 * come from a verified JWT (the caller's own `supabase.auth.getUser()`),
 * never from request-body input — same principle already applied to the
 * subscription-status checks in every analyze-* Edge Function.
 */

export class InsufficientCreditsError extends Error {}

function serviceRoleClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Atomically decrements the user's balance by 1 and records the
 * consumption transaction — called right before the AI request starts.
 * Throws InsufficientCreditsError when the balance was already 0 (the
 * Edge Function should report this as a distinct "no_credits" error code,
 * never a generic failure). */
export async function consumeDeepAnalysisCredit(
  userId: string,
  analysisId: string
): Promise<void> {
  const { error } = await serviceRoleClient().rpc("consume_deep_analysis_credit", {
    p_user_id: userId,
    p_analysis_id: analysisId,
  });
  if (error) {
    if (error.message?.includes("insufficient_credits")) {
      throw new InsufficientCreditsError();
    }
    throw new Error(`consume_deep_analysis_credit failed: ${error.message}`);
  }
}

/** Credits back the 1 consumed credit — only ever called after
 * consumeDeepAnalysisCredit succeeded but the deep analysis itself then
 * failed (AI error, malformed response) before producing a result, so the
 * user isn't charged for a failure outside their control. Best-effort:
 * logs rather than throws, since the caller is already in an error path
 * and a refund failure shouldn't mask the original ai_error response. */
export async function refundDeepAnalysisCredit(
  userId: string,
  analysisId: string
): Promise<void> {
  const { error } = await serviceRoleClient().rpc("refund_deep_analysis_credit", {
    p_user_id: userId,
    p_analysis_id: analysisId,
  });
  if (error) {
    console.error(
      `[deep-analysis-credits] refund failed for user=${userId} analysis=${analysisId}:`,
      error.message
    );
  }
}
