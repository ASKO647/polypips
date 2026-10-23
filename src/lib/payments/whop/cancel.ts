import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { whopFetch } from "./client";

/**
 * Whop equivalent of cancelStripeSubscription. Always passes
 * cancellation_mode explicitly ("at_period_end") rather than relying on
 * whatever Whop's own default is — the two official doc pages found
 * during research disagree on what that default is (see the delivery
 * report's §2d note), so this never omits it. Same access-cutoff model as
 * Stripe: the `subscriptions` row itself is only ever updated by the
 * webhook once Whop confirms the change (membership.cancel_at_period_end_
 * changed / membership.updated), never by this route directly.
 */
export async function cancelWhopSubscription(): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("whop_membership_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const membershipId = subscription?.whop_membership_id as string | null | undefined;
  if (!membershipId) {
    return NextResponse.json({ error: "no_subscription" }, { status: 400 });
  }

  try {
    await whopFetch(`/memberships/${membershipId}/cancel`, {
      method: "POST",
      body: { cancellation_mode: "at_period_end" },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[whop/cancel] failed", error);
    return NextResponse.json({ error: "whop_error" }, { status: 502 });
  }
}
