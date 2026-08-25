import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { userHasActiveAccess } from "@/lib/supabase/subscriptions";

/** Follows a Smart Wallet (Fomo/Axiom). No monthly quota today — unlike
 * Polymarket wallet-follows, pricing.ts has no numbered limit feature for
 * this yet, so this only gates on having an active subscription at all,
 * exactly like every other blurred feature on Polypips. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "Connectez-vous pour continuer." },
      { status: 401 }
    );
  }

  if (!(await userHasActiveAccess(supabase, user.id))) {
    return NextResponse.json(
      {
        error: "subscription_required",
        message: "Cette fonctionnalité est réservée aux abonnés. Débutez pour 0,99 €.",
      },
      { status: 403 }
    );
  }

  let body: { walletId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_input", message: "Corps de requête JSON invalide." },
      { status: 400 }
    );
  }

  if (!body.walletId) {
    return NextResponse.json(
      { error: "invalid_input", message: "walletId requis." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("user_signal_wallet_follows")
    .insert({ user_id: user.id, wallet_id: body.walletId });

  // A unique-constraint violation just means "already followed" — treat
  // it as success rather than surfacing a db_error for a no-op retry.
  if (error && error.code !== "23505") {
    return NextResponse.json(
      { error: "db_error", message: "Impossible de suivre ce wallet." },
      { status: 500 }
    );
  }

  return NextResponse.json({ walletId: body.walletId });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "Connectez-vous pour continuer." },
      { status: 401 }
    );
  }

  let body: { walletId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_input", message: "Corps de requête JSON invalide." },
      { status: 400 }
    );
  }

  if (!body.walletId) {
    return NextResponse.json(
      { error: "invalid_input", message: "walletId requis." },
      { status: 400 }
    );
  }

  // Unfollowing also disables Copy Trading for this wallet — leaving it
  // enabled with no follow relationship left behind would be a silent
  // state the user has no UI to discover or turn off again.
  await supabase
    .from("signal_copy_settings")
    .update({ enabled: false })
    .eq("user_id", user.id)
    .eq("wallet_id", body.walletId);

  const { error } = await supabase
    .from("user_signal_wallet_follows")
    .delete()
    .eq("user_id", user.id)
    .eq("wallet_id", body.walletId);

  if (error) {
    return NextResponse.json(
      { error: "db_error", message: "Impossible de ne plus suivre ce wallet." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
