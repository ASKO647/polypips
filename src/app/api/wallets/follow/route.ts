import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePlan } from "@/lib/supabase/subscriptions";
import { getMaxTrackedWallets } from "@/lib/data/pricing";
import { countFollowedWallets, WALLET_ADDRESS_RE } from "@/lib/supabase/wallets";

function shortLabel(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Follows an existing tracked wallet (walletId), or adds a user-supplied
 * address to the shared tracked pool and follows it in one step (address).
 * A newly-added wallet starts at 0 value/positions — the next
 * sync-smart-money run picks it up and backfills its real data. */
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

  let body: { walletId?: string; address?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_input", message: "Corps de requête JSON invalide." },
      { status: 400 }
    );
  }

  let walletId = body.walletId;

  if (!walletId && body.address) {
    const address = body.address.trim().toLowerCase();
    if (!WALLET_ADDRESS_RE.test(address)) {
      return NextResponse.json(
        {
          error: "invalid_address",
          message: "Adresse de portefeuille invalide. Format attendu : 0x suivi de 40 caractères hexadécimaux.",
        },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("tracked_wallets")
      .select("id")
      .eq("address", address)
      .maybeSingle();

    if (existing) {
      walletId = existing.id as string;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("tracked_wallets")
        .insert({
          address,
          label: shortLabel(address),
          source: "user_added",
          added_by: user.id,
        })
        .select("id")
        .single();

      if (insertError || !inserted) {
        return NextResponse.json(
          { error: "db_error", message: "Impossible d'ajouter ce portefeuille." },
          { status: 500 }
        );
      }
      walletId = inserted.id as string;
    }
  }

  if (!walletId) {
    return NextResponse.json(
      { error: "invalid_input", message: "Indiquez un portefeuille à suivre." },
      { status: 400 }
    );
  }

  const { data: alreadyFollowing } = await supabase
    .from("user_wallet_follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("wallet_id", walletId)
    .maybeSingle();

  if (alreadyFollowing) {
    return NextResponse.json({ walletId });
  }

  const plan = await getEffectivePlan(supabase, user.id);
  const maxWallets = getMaxTrackedWallets(plan);
  if (maxWallets !== null) {
    const currentCount = await countFollowedWallets(supabase, user.id);
    if (currentCount >= maxWallets) {
      return NextResponse.json(
        {
          error: "limit_reached",
          message: `Vous suivez déjà ${maxWallets} portefeuille(s), la limite de votre offre. Passez à un plan supérieur pour en suivre davantage.`,
        },
        { status: 403 }
      );
    }
  }

  const { error: followError } = await supabase
    .from("user_wallet_follows")
    .insert({ user_id: user.id, wallet_id: walletId });

  if (followError) {
    return NextResponse.json(
      { error: "db_error", message: "Impossible de suivre ce portefeuille." },
      { status: 500 }
    );
  }

  return NextResponse.json({ walletId });
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

  const { error } = await supabase
    .from("user_wallet_follows")
    .delete()
    .eq("user_id", user.id)
    .eq("wallet_id", body.walletId);

  if (error) {
    return NextResponse.json(
      { error: "db_error", message: "Impossible de ne plus suivre ce portefeuille." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
