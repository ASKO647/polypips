import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePlan } from "@/lib/supabase/subscriptions";
import { getMaxActiveCopyTradingStrategies } from "@/lib/data/pricing";
import { getQuotaLockState } from "@/lib/supabase/quota-cycles";
import { formatResetDate } from "@/lib/utils";

function lockedResponse(count: number, maxAllowed: number | null, periodEnd: string | null) {
  const resetLine = periodEnd
    ? ` Elle sera réinitialisée le ${formatResetDate(periodEnd)}.`
    : "";
  return NextResponse.json(
    {
      error: "locked",
      message: `Vous avez atteint votre limite mensuelle (${count}/${maxAllowed} stratégies actives) : impossible de changer votre sélection avant le renouvellement.${resetLine} Passez à un plan supérieur pour en activer davantage dès maintenant.`,
    },
    { status: 403 }
  );
}

/** Pause or resume an existing strategy. Both directions re-check the
 * plan's active-strategy quota once it's locked for the cycle — pausing
 * an active strategy would otherwise free a slot to activate a different
 * one, defeating the "can't change your selection" rule just as much as
 * resuming would. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  let body: { status?: "active" | "paused" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_input", message: "Corps de requête JSON invalide." },
      { status: 400 }
    );
  }

  if (body.status !== "active" && body.status !== "paused") {
    return NextResponse.json(
      { error: "invalid_input", message: "Statut invalide." },
      { status: 400 }
    );
  }

  const { data: strategy } = await supabase
    .from("copy_trading_strategies")
    .select("status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!strategy) {
    return NextResponse.json(
      { error: "not_found", message: "Stratégie introuvable." },
      { status: 404 }
    );
  }

  const plan = await getEffectivePlan(supabase, user.id);
  const maxStrategies = getMaxActiveCopyTradingStrategies(plan);

  if (body.status === "active" && strategy.status !== "active") {
    const lock = await getQuotaLockState(supabase, user.id, "copy_trading", maxStrategies);
    if (lock.locked) return lockedResponse(lock.count, lock.maxAllowed, lock.periodEnd);
  }

  if (body.status === "paused" && strategy.status === "active") {
    const lock = await getQuotaLockState(supabase, user.id, "copy_trading", maxStrategies);
    if (lock.locked) return lockedResponse(lock.count, lock.maxAllowed, lock.periodEnd);
  }

  const { error } = await supabase
    .from("copy_trading_strategies")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "db_error", message: "Impossible de mettre à jour cette stratégie." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

/** Stopping (deleting) an active strategy is the same kind of "change my
 * selection" as pausing it — blocked once the cycle's quota is locked, for
 * the same reason. A paused, non-counted strategy can always be deleted. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const { data: strategy } = await supabase
    .from("copy_trading_strategies")
    .select("status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!strategy) {
    return NextResponse.json(
      { error: "not_found", message: "Stratégie introuvable." },
      { status: 404 }
    );
  }

  if (strategy.status === "active") {
    const plan = await getEffectivePlan(supabase, user.id);
    const maxStrategies = getMaxActiveCopyTradingStrategies(plan);
    const lock = await getQuotaLockState(supabase, user.id, "copy_trading", maxStrategies);
    if (lock.locked) return lockedResponse(lock.count, lock.maxAllowed, lock.periodEnd);
  }

  const { error } = await supabase
    .from("copy_trading_strategies")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "db_error", message: "Impossible d'arrêter cette stratégie." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
