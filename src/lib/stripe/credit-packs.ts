/**
 * One-time credit packs for the "Analyse Approfondie" feature — distinct
 * from PLAN_PRICE_IDS (lib/stripe/plans.ts), which is the recurring Pro
 * subscription. These are never a Stripe Price object (no product to
 * manage in the Dashboard): each Checkout Session builds its own
 * price_data line item inline, same technique already used for the
 * Découverte plan's 0,99€ upfront charge in /api/stripe/checkout.
 */

export type CreditPackId = "decouverte" | "standard" | "pro" | "power";

export type CreditPack = {
  id: CreditPackId;
  credits: number;
  priceCents: number;
};

export const CREDIT_PACKS: Record<CreditPackId, CreditPack> = {
  decouverte: { id: "decouverte", credits: 5, priceCents: 499 },
  standard: { id: "standard", credits: 20, priceCents: 1499 },
  pro: { id: "pro", credits: 50, priceCents: 2999 },
  power: { id: "power", credits: 150, priceCents: 7499 },
};

// Ordered for display — Object.values on the Record above isn't guaranteed
// to preserve this exact order across engines for string keys, so the
// pricing page reads this array rather than iterating CREDIT_PACKS itself.
export const CREDIT_PACK_ORDER: CreditPackId[] = ["decouverte", "standard", "pro", "power"];

export function isCreditPackId(value: string): value is CreditPackId {
  return value in CREDIT_PACKS;
}

/** Price per credit, in euros — the number displayed next to each pack so
 * the discount at higher tiers is obvious at a glance. */
export function pricePerCredit(pack: CreditPack): number {
  return pack.priceCents / 100 / pack.credits;
}
