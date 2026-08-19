import { getStripe } from "@/lib/stripe/server";

/**
 * Revenue and payment figures for the owner console's Revenue and Payments
 * pages come straight from Stripe's own API rather than being re-derived
 * from public.subscriptions, which never stored actual charged amounts —
 * Stripe is the one source that's guaranteed to match what was really
 * charged, refunded, or failed. All calls are scoped by created[gte/lte]
 * and paginated by Stripe itself (auto_paging_each), never a single
 * unbounded list() call.
 */

export type OwnerPaymentsSummary = {
  grossRevenueEur: number;
  refundedEur: number;
  netRevenueEur: number;
  succeededCount: number;
  failedCount: number;
  refundedCount: number;
};

function centsToEur(cents: number) {
  return cents / 100;
}

/** Sums succeeded charges, refunds, and counts failed payment intents in
 * the given window. `since`/`until` are inclusive; pass since=null for
 * "Tout" (no lower bound — still bounded by Stripe's own pagination). */
export async function fetchOwnerPaymentsSummary(
  since: Date | null,
  until: Date = new Date()
): Promise<OwnerPaymentsSummary> {
  const stripe = getStripe();
  const created: { lte: number; gte?: number } = {
    lte: Math.floor(until.getTime() / 1000),
    ...(since ? { gte: Math.floor(since.getTime() / 1000) } : {}),
  };

  let grossCents = 0;
  let succeededCount = 0;
  let failedCount = 0;

  for await (const charge of stripe.charges.list({ created, limit: 100 })) {
    if (charge.status === "succeeded") {
      grossCents += charge.amount;
      succeededCount += 1;
    } else if (charge.status === "failed") {
      failedCount += 1;
    }
  }

  let refundedCents = 0;
  let refundedCount = 0;
  for await (const refund of stripe.refunds.list({ created, limit: 100 })) {
    refundedCents += refund.amount;
    refundedCount += 1;
  }

  return {
    grossRevenueEur: centsToEur(grossCents),
    refundedEur: centsToEur(refundedCents),
    netRevenueEur: centsToEur(grossCents - refundedCents),
    succeededCount,
    failedCount,
    refundedCount,
  };
}

export type OwnerPaymentRow = {
  id: string;
  amountEur: number;
  status: string;
  customerEmail: string | null;
  createdAt: string;
  refunded: boolean;
};

/** A recent-payments feed for the Payments page's table — most recent
 * first, capped by `limit` (Stripe list default order is already
 * created-desc). */
export async function fetchRecentOwnerPayments(limit = 25): Promise<OwnerPaymentRow[]> {
  const stripe = getStripe();
  const charges = await stripe.charges.list({ limit });

  return charges.data.map((charge) => ({
    id: charge.id,
    amountEur: centsToEur(charge.amount),
    status: charge.status,
    customerEmail: charge.billing_details?.email ?? charge.receipt_email ?? null,
    createdAt: new Date(charge.created * 1000).toISOString(),
    refunded: charge.refunded,
  }));
}
