#!/usr/bin/env node
/**
 * One-time migration: grandfathers every currently-active/trialing "pro"
 * subscriber onto "pro_legacy" at the moment the 3-tier pricing structure
 * ships, so nobody who's already paying 29,99 €/mois for unlimited access
 * loses it overnight — they keep every quota unlimited for as long as
 * they stay continuously subscribed (see PLAN_METADATA's pro_legacy row
 * in src/lib/data/pricing.ts and the "confirmed" migration approach in
 * the project's own notes). New signups always land on the new, tighter
 * "pro" tier — this script never touches anyone who subscribes after it
 * runs.
 *
 * Must update BOTH sides, or they'll drift the moment any webhook event
 * next fires for that subscription:
 *   1. The Stripe subscription's own metadata.plan — resolvePlan() in
 *      /api/stripe/webhook reads metadata.plan first, so every future
 *      webhook event (renewal, cancellation, ...) needs to already see
 *      "pro_legacy" there, or it would silently fall back to "pro" and
 *      undo the grandfathering on the very next event.
 *   2. The local `subscriptions.plan` row, for immediate effect without
 *      waiting for the next webhook delivery.
 *
 * This is a real, hard-to-reverse production mutation against live
 * Stripe subscriptions and paying customers — it is NOT run automatically
 * by any migration or deploy step. Run it BY HAND, once, right when the
 * 3-tier structure ships:
 *
 *   node scripts/migrate-legacy-pro.mjs            # dry run (default) — lists what WOULD change, changes nothing
 *   node scripts/migrate-legacy-pro.mjs --apply     # actually applies the changes above
 *
 * Required env vars (same ones the app itself uses):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

async function main() {
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));

  const { data: rows, error } = await supabase
    .from("subscriptions")
    .select("user_id, stripe_subscription_id, plan, status, cancel_at_period_end")
    .eq("plan", "pro")
    .in("status", ["active", "trialing"])
    .eq("cancel_at_period_end", false);

  if (error) {
    console.error("Failed to read subscriptions:", error.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log("No active/trialing 'pro' subscribers found — nothing to do.");
    return;
  }

  console.log(
    `${APPLY ? "APPLYING" : "DRY RUN"} — ${rows.length} subscriber(s) to grandfather onto 'pro_legacy':`
  );

  let succeeded = 0;
  let failed = 0;

  for (const row of rows) {
    console.log(` - user ${row.user_id} (stripe_subscription_id=${row.stripe_subscription_id ?? "none"})`);

    if (!APPLY) continue;
    if (!row.stripe_subscription_id) {
      console.error(`   ✗ skipped — no stripe_subscription_id on this row.`);
      failed++;
      continue;
    }

    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
      await stripe.subscriptions.update(row.stripe_subscription_id, {
        metadata: { ...stripeSubscription.metadata, plan: "pro_legacy" },
      });

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({ plan: "pro_legacy", updated_at: new Date().toISOString() })
        .eq("user_id", row.user_id);

      if (updateError) throw new Error(updateError.message);

      console.log(`   ✓ done`);
      succeeded++;
    } catch (err) {
      console.error(`   ✗ failed:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  if (APPLY) {
    console.log(`\nDone — ${succeeded} succeeded, ${failed} failed.`);
  } else {
    console.log("\nDry run only — re-run with --apply to actually make these changes.");
  }
}

main();
