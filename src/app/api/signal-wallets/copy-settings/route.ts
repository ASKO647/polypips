import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { userHasActiveAccess } from "@/lib/supabase/subscriptions";

type UpsertSettingsBody = {
  walletId?: string;
  enabled?: boolean;
  maxPositionAmount?: number;
  positionPercent?: number;
  maxDailyAmount?: number;
  maxSimultaneousPositions?: number;
  maxSlippagePercent?: number;
  excludedTokens?: string[];
};

function isValid(body: UpsertSettingsBody): boolean {
  return (
    typeof body.walletId === "string" &&
    typeof body.enabled === "boolean" &&
    typeof body.maxPositionAmount === "number" &&
    body.maxPositionAmount > 0 &&
    typeof body.positionPercent === "number" &&
    body.positionPercent > 0 &&
    body.positionPercent <= 100 &&
    typeof body.maxDailyAmount === "number" &&
    body.maxDailyAmount > 0 &&
    typeof body.maxSimultaneousPositions === "number" &&
    body.maxSimultaneousPositions >= 1 &&
    typeof body.maxSlippagePercent === "number" &&
    body.maxSlippagePercent > 0 &&
    body.maxSlippagePercent <= 100
  );
}

/** Creates or updates a user's Copy Trading risk envelope for one Smart
 * Wallet — this is what the Risk Engine (sync-signal-wallets) reads on
 * every fresh trade. Requires an existing follow: Copy Trading can't be
 * turned on for a wallet the user isn't even following. */
export async function PUT(request: Request) {
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

  let body: UpsertSettingsBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_input", message: "Corps de requête JSON invalide." },
      { status: 400 }
    );
  }

  if (!isValid(body)) {
    return NextResponse.json(
      { error: "invalid_input", message: "Paramètres de risque manquants ou invalides." },
      { status: 400 }
    );
  }

  const { data: follow } = await supabase
    .from("user_signal_wallet_follows")
    .select("wallet_id")
    .eq("user_id", user.id)
    .eq("wallet_id", body.walletId)
    .maybeSingle();

  if (!follow) {
    return NextResponse.json(
      {
        error: "not_followed",
        message: "Vous devez suivre ce Smart Wallet avant d'activer le Copy Trading.",
      },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("signal_copy_settings").upsert(
    {
      user_id: user.id,
      wallet_id: body.walletId,
      enabled: body.enabled,
      max_position_amount: body.maxPositionAmount,
      position_percent: body.positionPercent,
      max_daily_amount: body.maxDailyAmount,
      max_simultaneous_positions: body.maxSimultaneousPositions,
      max_slippage_percent: body.maxSlippagePercent,
      excluded_tokens: body.excludedTokens ?? [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,wallet_id" }
  );

  if (error) {
    return NextResponse.json(
      { error: "db_error", message: "Impossible d'enregistrer les paramètres de Copy Trading." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
