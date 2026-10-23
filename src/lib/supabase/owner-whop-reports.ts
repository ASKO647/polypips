import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Whop revenue/refunds/disputes for the owner console, built entirely
 * from this app's own whop_webhook_events ledger (every delivery is
 * stored there — see the Whop webhook route and its migration) rather
 * than a live call to Whop's own payments-list API, unlike
 * lib/stripe/owner-reports.ts, which calls stripe.charges.list()/
 * refunds.list() directly. That's a deliberate scope limit for this
 * delivery, not an oversight — flagged in the report. Real data only: an
 * empty ledger returns hasData:false, never fabricated zeros.
 */

type PaymentPayload = {
  type: string;
  data: {
    id?: string;
    final_amount?: number;
    total?: number;
    amount?: number;
    currency?: string;
    metadata?: { type?: string };
  };
};

export type OwnerWhopSummary = {
  hasData: boolean;
  grossRevenueEur: number;
  succeededCount: number;
  failedCount: number;
  refundedCount: number;
  disputedCount: number;
};

function paidAmount(data: PaymentPayload["data"]): number {
  return data.final_amount ?? data.total ?? data.amount ?? 0;
}

export async function fetchOwnerWhopSummary(since: Date | null): Promise<OwnerWhopSummary> {
  const supabase = createAdminClient();
  let query = supabase
    .from("whop_webhook_events")
    .select("type, payload")
    .in("type", ["payment.succeeded", "payment.failed", "refund.created", "dispute.created"]);
  if (since) {
    query = query.gte("received_at", since.toISOString());
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    if (error) console.error("[owner-whop-reports] fetch failed", error);
    return {
      hasData: false,
      grossRevenueEur: 0,
      succeededCount: 0,
      failedCount: 0,
      refundedCount: 0,
      disputedCount: 0,
    };
  }

  let grossRevenueEur = 0;
  let succeededCount = 0;
  let failedCount = 0;
  let refundedCount = 0;
  let disputedCount = 0;

  for (const row of data as { type: string; payload: PaymentPayload }[]) {
    if (row.type === "payment.succeeded") {
      succeededCount += 1;
      grossRevenueEur += paidAmount(row.payload.data);
    } else if (row.type === "payment.failed") {
      failedCount += 1;
    } else if (row.type === "refund.created") {
      refundedCount += 1;
    } else if (row.type === "dispute.created") {
      disputedCount += 1;
    }
  }

  return {
    hasData: true,
    grossRevenueEur,
    succeededCount,
    failedCount,
    refundedCount,
    disputedCount,
  };
}
