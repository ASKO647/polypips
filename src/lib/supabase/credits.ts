import type { SupabaseClient } from "@supabase/supabase-js";

export type CreditTransactionType =
  | "purchase"
  | "consumption"
  | "refund"
  | "welcome"
  | "referral"
  | "plan_grant"
  | "plan_reset";

export type CreditTransaction = {
  id: string;
  amount: number;
  type: CreditTransactionType;
  relatedAnalysisId: string | null;
  createdAt: string;
};

type CreditTransactionRow = {
  id: string;
  amount: number;
  type: CreditTransactionType;
  related_analysis_id: string | null;
  created_at: string;
};

/** Current Deep Analysis credit balance for the signed-in user — 0 (not
 * null) when the user has never purchased credits, since no row in
 * user_credits is the common case, not an error. Writes only ever happen
 * server-side via the SECURITY DEFINER RPCs in the credits system
 * migration (never a direct insert/update from this client). */
export async function fetchCreditBalance(supabase: SupabaseClient): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  // Best-effort: grants this billing cycle's included Deep Analysis
  // credits (Pro+/Ultimate) if the cycle just rolled over and nobody has
  // triggered the sync yet (see sync_plan_credits_cycle in the 3-tier
  // pricing migration) — a no-op for every other plan/state. Never blocks
  // the balance read on failure.
  await supabase.rpc("ensure_plan_credits_grant");

  const { data } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  return data?.balance ?? 0;
}

export async function fetchCreditTransactions(
  supabase: SupabaseClient,
  limit = 50
): Promise<CreditTransaction[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("credit_transactions")
    .select("id, amount, type, related_analysis_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as CreditTransactionRow[]).map((row) => ({
    id: row.id,
    amount: row.amount,
    type: row.type,
    relatedAnalysisId: row.related_analysis_id,
    createdAt: row.created_at,
  }));
}
