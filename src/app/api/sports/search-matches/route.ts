import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchMatchesByTeams } from "@/lib/sports/service";

/** Backs Overview's "Rechercher un match" box — real upcoming (or recently
 * played) fixtures between two named teams, read-only. Not subscription-
 * gated at this layer, same as every other Sports read (listUpcomingMatches,
 * getOverviewStats, ...): browsing real match data isn't a metered
 * resource the way an analysis or a wallet lookup is, so only the page's
 * own LockedOverlay decides what a non-subscriber can see. Still requires
 * a session, like any other dashboard endpoint. */
export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const teamA = searchParams.get("teamA") ?? "";
  const teamB = searchParams.get("teamB") ?? "";

  if (!teamA.trim() || !teamB.trim()) {
    return NextResponse.json(
      { error: "invalid_input", message: "Indiquez les deux équipes recherchées." },
      { status: 400 }
    );
  }

  const matches = await searchMatchesByTeams(teamA, teamB);
  return NextResponse.json({ matches });
}
