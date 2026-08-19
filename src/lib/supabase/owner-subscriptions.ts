import { createAdminClient } from "@/lib/supabase/admin";

/** The only real recurring price in the system (see PLAN_PRICE_IDS in
 * lib/stripe/plans.ts) — both "decouverte" (after its 3-day/0,99€ trial)
 * and "pro" bill through this exact price, so every active/trialing row is
 * worth the same amount regardless of which plan value it currently has. */
const PRO_MONTHLY_PRICE_EUR = 29.99;

export type OwnerSubscriptionSummary = {
  discovertActiveTrials: number;
  proActive: number;
  pastDue: number;
  canceledInPeriod: number;
  conversionsInPeriod: number;
  trialsStartedInPeriod: number;
  conversionRatePercent: number | null;
  mrrEur: number;
  mrrProjectedEur: number;
  arrEur: number;
  arpuEur: number;
  churnRatePercent: number | null;
  ltvEur: number | null;
};

type RawSub = {
  plan: string;
  status: string;
  created_at: string;
  updated_at: string;
  converted_from_trial: boolean;
  converted_at: string | null;
};

/** All aggregates for the Subscriptions/Revenue overview computed from one
 * fetch of public.subscriptions, scoped to what the caller actually needs
 * (only the 5 columns used below) — never the full row set including
 * Stripe ids. `since` is null for "Tout". */
export async function fetchOwnerSubscriptionSummary(
  since: Date | null
): Promise<OwnerSubscriptionSummary> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan, status, created_at, updated_at, converted_from_trial, converted_at");

  if (error || !data) {
    console.error("[owner-subscriptions] fetch failed", error);
    return {
      discovertActiveTrials: 0,
      proActive: 0,
      pastDue: 0,
      canceledInPeriod: 0,
      conversionsInPeriod: 0,
      trialsStartedInPeriod: 0,
      conversionRatePercent: null,
      mrrEur: 0,
      mrrProjectedEur: 0,
      arrEur: 0,
      arpuEur: 0,
      churnRatePercent: null,
      ltvEur: null,
    };
  }

  const rows = data as RawSub[];
  const sinceMs = since?.getTime() ?? null;
  const inPeriod = (iso: string | null) =>
    sinceMs === null || (iso !== null && new Date(iso).getTime() >= sinceMs);

  const activeRows = rows.filter((r) => r.status === "active");
  const trialingRows = rows.filter((r) => r.status === "trialing");
  const canceledInPeriod = rows.filter(
    (r) => r.status === "canceled" && inPeriod(r.updated_at)
  );
  const conversionsInPeriod = rows.filter(
    (r) => r.converted_from_trial && inPeriod(r.converted_at)
  );
  // Every checkout starts life as a "decouverte" trial (the only entry
  // point — see /api/stripe/checkout), so created_at in-period is a real
  // proxy for "trial started in period" regardless of the row's current
  // plan value today.
  const trialsStartedInPeriod = rows.filter((r) => inPeriod(r.created_at)).length;

  const proActive = activeRows.length;
  const discovertActiveTrials = trialingRows.length;
  const pastDue = rows.filter((r) => r.status === "past_due").length;

  const mrrEur = proActive * PRO_MONTHLY_PRICE_EUR;
  const mrrProjectedEur = mrrEur + discovertActiveTrials * PRO_MONTHLY_PRICE_EUR;
  const arrEur = mrrEur * 12;
  const arpuEur = proActive > 0 ? mrrEur / proActive : 0;

  // Indicative only: churn rate here is churned-in-period over
  // (active-now + churned-in-period), a simple proxy for "active at the
  // start of the period" since we don't keep a daily active-subscriber
  // snapshot. LTV follows from it (ARPU / monthly churn rate) and inherits
  // the same caveat — both are explicitly labelled as estimates in the UI.
  const baseline = proActive + canceledInPeriod.length;
  const churnRatePercent = baseline > 0 ? (canceledInPeriod.length / baseline) * 100 : null;
  const ltvEur =
    churnRatePercent && churnRatePercent > 0 ? arpuEur / (churnRatePercent / 100) : null;

  const conversionRatePercent =
    trialsStartedInPeriod > 0 ? (conversionsInPeriod.length / trialsStartedInPeriod) * 100 : null;

  return {
    discovertActiveTrials,
    proActive,
    pastDue,
    canceledInPeriod: canceledInPeriod.length,
    conversionsInPeriod: conversionsInPeriod.length,
    trialsStartedInPeriod,
    conversionRatePercent,
    mrrEur,
    mrrProjectedEur,
    arrEur,
    arpuEur,
    churnRatePercent,
    ltvEur,
  };
}
