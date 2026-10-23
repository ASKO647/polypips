import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Read-only poll target for CheckoutPendingBanner — grants nothing, just
 * reports the current subscriptions row so the banner can detect the
 * moment the webhook (Stripe or Whop, whichever is active) has actually
 * processed the payment and refresh the page. Never trust this for
 * granting access anywhere else; it's a UI convenience only.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, cancel_at_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    plan: data?.plan ?? null,
    status: data?.status ?? null,
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
  });
}
