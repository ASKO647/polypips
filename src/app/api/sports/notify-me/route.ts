import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSportCategory } from "@/lib/sports/nav";

/** "M'avertir quand disponible" on a not-yet-covered sport's page. There's
 * no launch-trigger pipeline to fire a real notification later — this
 * writes one confirmation row straight into the existing notifications
 * table so the request is real and visible in NotificationsBell, without
 * pretending a follow-up notification will arrive automatically. */
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

  let body: { sport?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_input", message: "Corps de requête JSON invalide." },
      { status: 400 }
    );
  }

  const category = body.sport ? getSportCategory(body.sport) : undefined;
  if (!category) {
    return NextResponse.json(
      { error: "invalid_input", message: "Sport inconnu." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("notifications").insert({
    user_id: user.id,
    title: "Demande enregistrée",
    description: `Vous serez averti(e) quand l'analyse ${category.label} sera disponible sur Polypips.`,
    link_url: `/dashboard/sports/${category.key}`,
    read: false,
  });

  if (error) {
    return NextResponse.json(
      { error: "db_error", message: "Impossible d'enregistrer votre demande." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
