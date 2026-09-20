import type { PlanId } from "@/lib/stripe/plans";

/**
 * Single source of truth for "is plan X good enough for feature Y",
 * across the entire dashboard — every tier-gated blur/lock (Sélectionnés
 * on-demand scan, Smart Wallet cap, Coach IA cap, MoonX, Communauté
 * Ultimate badge, weekly report, multi-platform, ...) goes through
 * meetsPlan() below instead of hand-rolling its own plan comparison, so
 * the 3-tier ordering can never drift between call sites.
 *
 * "pro_legacy" (the grandfathered old-Pro plan, see the 3-tier migration)
 * ranks alongside Ultimate — it keeps every quota unlimited for as long as
 * the subscriber stays continuously subscribed — but it does NOT
 * automatically unlock features that didn't exist under the old plan
 * (MoonX, weekly report, multi-platform, included credits, Ultimate
 * badge): those are gated by their own explicit PlanMeta boolean instead
 * of rank, see lib/data/pricing.ts.
 */
const PLAN_RANK: Record<PlanId, number> = {
  decouverte: 1,
  pro: 1,
  pro_plus: 2,
  ultimate: 3,
  pro_legacy: 3,
};

/** True when `current` grants at least as much access as `minimum` — the
 * one function every tier-gated feature check should call. `current` is
 * null for a user with no active subscription at all (never subscribed,
 * or fully lapsed), which never meets any minimum. */
export function meetsPlan(current: PlanId | null | undefined, minimum: PlanId): boolean {
  if (!current) return false;
  return PLAN_RANK[current] >= PLAN_RANK[minimum];
}

/** Which paid tier a "Passez à ..." CTA should upgrade to for a given
 * minimum-required plan — always one of the two real upgrade targets, never
 * "decouverte" (nothing upgrades to the discovery offer) or "pro_legacy"
 * (never checkout-selectable). */
export function upgradeTargetPlan(minimum: PlanId): "pro" | "pro_plus" | "ultimate" {
  if (minimum === "ultimate") return "ultimate";
  if (minimum === "pro_plus") return "pro_plus";
  return "pro";
}
