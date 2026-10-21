import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Permanently deletes the signed-in user's account. Verifies the session
 * server-side (never trusts a client-supplied id) and refuses while an
 * active, non-cancelled Stripe subscription is still on file — the
 * customer has to cancel billing first so we never delete a user Stripe
 * still thinks it should be charging. Actual deletion runs through the
 * service-role admin client (auth.admin.deleteUser), which cascades to
 * every table with an `on delete cascade` foreign key to auth.users
 * (subscriptions, user_settings, notifications, credits, analyses, …).
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, cancel_at_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  const hasActiveBilling =
    subscription &&
    (subscription.status === "active" || subscription.status === "trialing" || subscription.status === "past_due") &&
    !subscription.cancel_at_period_end;

  if (hasActiveBilling) {
    return NextResponse.json(
      { message: "Annulez d'abord votre abonnement avant de supprimer votre compte." },
      { status: 409 }
    );
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[account/delete] failed", error);
    return NextResponse.json(
      { message: "La suppression du compte a échoué. Réessayez." },
      { status: 500 }
    );
  }
}
