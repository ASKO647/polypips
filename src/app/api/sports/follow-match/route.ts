import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Follows/unfollows a match by its fixture id (see lib/sports/mock-data.ts
 * — no matches table exists yet, so this is a plain text id, not a foreign
 * key). Following isn't gated behind an active subscription: it's a
 * bookmark/notification preference, not a resource with a plan-based quota
 * like tracked wallets. On follow, a confirmation row is written straight
 * into the existing notifications table — real match-update notifications
 * (score changes, kickoff reminders) need a live results feed this app
 * doesn't have yet, but the wiring into the same NotificationsBell users
 * already see is real starting today. */
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

  let body: { matchId?: string; matchLabel?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_input", message: "Corps de requête JSON invalide." },
      { status: 400 }
    );
  }

  if (!body.matchId) {
    return NextResponse.json(
      { error: "invalid_input", message: "matchId requis." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("sports_match_follows")
    .insert({ user_id: user.id, match_id: body.matchId });

  if (error && error.code !== "23505") {
    return NextResponse.json(
      { error: "db_error", message: "Impossible de suivre ce match." },
      { status: 500 }
    );
  }

  if (!error) {
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Match suivi",
      description: body.matchLabel
        ? `Vous suivez désormais ${body.matchLabel}.`
        : "Vous suivez désormais ce match.",
      link_url: `/dashboard/sports/match/${body.matchId}`,
      read: false,
    });
  }

  return NextResponse.json({ matchId: body.matchId });
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

  let body: { matchId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_input", message: "Corps de requête JSON invalide." },
      { status: 400 }
    );
  }

  if (!body.matchId) {
    return NextResponse.json(
      { error: "invalid_input", message: "matchId requis." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("sports_match_follows")
    .delete()
    .eq("user_id", user.id)
    .eq("match_id", body.matchId);

  if (error) {
    return NextResponse.json(
      { error: "db_error", message: "Impossible de ne plus suivre ce match." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
