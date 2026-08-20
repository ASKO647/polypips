import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Same shape as /api/sports/follow-match, for team follows ("Mes
 * équipes"). See that route's top comment for the notification-wiring
 * rationale. */
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

  let body: { teamId?: string; teamName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_input", message: "Corps de requête JSON invalide." },
      { status: 400 }
    );
  }

  if (!body.teamId) {
    return NextResponse.json(
      { error: "invalid_input", message: "teamId requis." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("sports_team_follows")
    .insert({ user_id: user.id, team_id: body.teamId });

  if (error && error.code !== "23505") {
    return NextResponse.json(
      { error: "db_error", message: "Impossible de suivre cette équipe." },
      { status: 500 }
    );
  }

  if (!error) {
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Équipe suivie",
      description: body.teamName
        ? `Vous suivez désormais ${body.teamName}.`
        : "Vous suivez désormais cette équipe.",
      link_url: "/dashboard/sports/mes-equipes",
      read: false,
    });
  }

  return NextResponse.json({ teamId: body.teamId });
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

  let body: { teamId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_input", message: "Corps de requête JSON invalide." },
      { status: 400 }
    );
  }

  if (!body.teamId) {
    return NextResponse.json(
      { error: "invalid_input", message: "teamId requis." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("sports_team_follows")
    .delete()
    .eq("user_id", user.id)
    .eq("team_id", body.teamId);

  if (error) {
    return NextResponse.json(
      { error: "db_error", message: "Impossible de ne plus suivre cette équipe." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
