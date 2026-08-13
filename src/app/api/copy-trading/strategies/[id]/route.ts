import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePlan } from "@/lib/supabase/subscriptions";
import { getMaxActiveCopyTradingStrategies } from "@/lib/data/pricing";
import { countActiveStrategies } from "@/lib/supabase/copy-trading";

/** Pause or resume an existing strategy. Resuming re-checks the plan's
 * active-strategy limit, the same as creating a new one. */
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

  if (body.status === "active") {
    const plan = await getEffectivePlan(supabase, user.id);
    const maxStrategies = getMaxActiveCopyTradingStrategies(plan);
    if (maxStrategies !== null) {
      const currentActive = await countActiveStrategies(supabase, user.id);
      if (currentActive >= maxStrategies) {
        return NextResponse.json(
          {
            error: "limit_reached",
            message: `Vous avez déjà ${maxStrategies} stratégie(s) active(s), la limite de votre offre.`,
          },
          { status: 403 }
        );
      }
    }
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
