import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  OddsApiUnavailableError,
  fetchOddsApiEvents,
  fetchOddsApiSports,
  type OddsApiSportInfo,
} from "../_shared/odds-api.ts";

/**
 * The individual-athlete counterpart to sync-sports-data — covers tennis,
 * boxing and MMA via The Odds API, kept as its own function (and its own
 * odds_api_*_cache tables, see that migration's file comment) rather than
 * folded into sync-sports-data, because:
 *   - different provider, different auth scheme (query param vs header),
 *     different quota (100 req/hour, reset hourly, vs API-Sports' 100/day
 *     per sport host) — mixing the two inside one function would make
 *     neither's quota reasoning legible;
 *   - different id shapes (opaque strings here vs API-Sports' stable
 *     numeric ids) that the existing sports_*_cache columns are typed for;
 *   - tennis has no country/league structure to sync — it's discovered by
 *     sport_key prefix (tennis_atp_*, tennis_wta_*), not resolved by name
 *     search like sync-sports-data's featured competitions.
 *
 * Two things happen per run:
 * 1. Discover every currently-active competition this account's plan
 *    covers: every tennis_* sport_key (one per tournament — Roland-Garros,
 *    Wimbledon, etc., real and dynamic, never hardcoded) plus the two
 *    fixed boxing/MMA sport_keys, IF they're actually present and active
 *    in this account's own /v4/sports response — confirmed, never assumed.
 * 2. For each, fetch its near-term schedule (/events — no odds, see
 *    _shared/odds-api.ts) and cache it.
 *
 * Every competition is processed independently inside its own try/catch —
 * one tournament's fetch failing must never take down the rest of the run.
 */

type IndividualSport = "tennis" | "boxing" | "mma";

/** boxing_boxing and mma_mixed_martial_arts aren't split by promotion/
 * tournament on The Odds API — one fixed sport_key covers all boxing (or
 * all MMA) events, confirmed present and active on this account's plan
 * before being added here (2026-08-27). If either ever disappears from
 * /v4/sports, the discovery loop below simply stops finding it — no error,
 * no fixture wipe of what's already cached. */
const STATIC_SPORTS: { sportKey: string; sport: IndividualSport; circuit: string }[] = [
  { sportKey: "boxing_boxing", sport: "boxing", circuit: "Boxe" },
  { sportKey: "mma_mixed_martial_arts", sport: "mma", circuit: "MMA" },
];

function tennisCircuit(sportKey: string): string {
  if (sportKey.startsWith("tennis_atp_")) return "ATP";
  if (sportKey.startsWith("tennis_wta_")) return "WTA";
  if (sportKey.startsWith("tennis_itf_")) return "ITF";
  return "Tennis";
}

/** Only fixtures/events kicking off within this many days from now are
 * kept cached — same reasoning as sync-sports-data's FIXTURE_WINDOW_DAYS. */
const EVENT_WINDOW_DAYS = 21;
/** Hard cap per competition regardless of how many fall inside the window. */
const MAX_EVENTS_PER_COMPETITION = 30;
/** Safety cap on how many competitions get an /events call in one run —
 * tennis can have many tournaments active at once (multiple ATP/WTA/ITF
 * events run concurrently through most of the season). At 1 request/sport
 * (free) + 1 request/competition, this cap plus an hourly cron (matching
 * the quota's hourly reset) stays comfortably inside 100 requests/hour
 * even with boxing/MMA's 2 extra requests included. */
const MAX_COMPETITIONS_PER_RUN = 40;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(
      JSON.stringify({
        error: "unauthorized",
        message: "Cette fonction ne peut être déclenchée qu'avec la clé service role.",
      }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Edge Function secret (Dashboard → Edge Functions → Secrets, or
  // `supabase secrets set ODDS_API_KEY=...`) — same store as
  // API_SPORTS_KEY, never the Vault.
  const apiKey = Deno.env.get("ODDS_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "missing_api_key",
        message:
          "ODDS_API_KEY est introuvable comme secret de Edge Function. Vérifie Project Settings → Edge Functions → Secrets (ou `supabase secrets set ODDS_API_KEY=...`).",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
  const windowEnd = new Date(Date.now() + EVENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  let catalog: OddsApiSportInfo[];
  try {
    catalog = await fetchOddsApiSports(apiKey);
  } catch (error) {
    const message =
      error instanceof OddsApiUnavailableError || error instanceof Error ? error.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({ error: "odds_api_unavailable", message }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const discovered: { sportKey: string; sport: IndividualSport; circuit: string; title: string }[] = [];
  for (const entry of catalog) {
    if (!entry.active) continue;
    if (entry.key.startsWith("tennis_")) {
      discovered.push({ sportKey: entry.key, sport: "tennis", circuit: tennisCircuit(entry.key), title: entry.title });
    }
  }
  for (const staticEntry of STATIC_SPORTS) {
    const match = catalog.find((s) => s.key === staticEntry.sportKey && s.active);
    if (match) {
      discovered.push({ sportKey: staticEntry.sportKey, sport: staticEntry.sport, circuit: staticEntry.circuit, title: match.title });
    }
  }

  const toProcess = discovered.slice(0, MAX_COMPETITIONS_PER_RUN);

  const results: Array<{ sportKey: string; sport: string; eventsCached: number; error: string | null }> = [];

  for (const competition of toProcess) {
    let eventsCached = 0;
    let errorMessage: string | null = null;

    try {
      const { data: upserted, error: upsertError } = await supabase
        .from("odds_api_competitions_cache")
        .upsert(
          {
            sport: competition.sport,
            odds_api_sport_key: competition.sportKey,
            circuit: competition.circuit,
            title: competition.title,
            active: true,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "sport,odds_api_sport_key" }
        )
        .select("id")
        .single();
      if (upsertError || !upserted) {
        throw new Error(`écriture compétition échouée : ${upsertError?.message ?? "réponse vide"}`);
      }
      const competitionId = upserted.id as string;

      const events = await fetchOddsApiEvents(competition.sportKey, apiKey);
      const now = new Date();
      const upcoming = events
        .filter((event) => new Date(event.commenceAt) <= windowEnd)
        .sort((a, b) => a.commenceAt.localeCompare(b.commenceAt))
        .slice(0, MAX_EVENTS_PER_COMPETITION);

      const { error: deleteError } = await supabase
        .from("odds_api_matches_cache")
        .delete()
        .eq("competition_id", competitionId);
      if (deleteError) throw new Error(`purge matchs échouée : ${deleteError.message}`);

      if (upcoming.length > 0) {
        const { error: insertError } = await supabase.from("odds_api_matches_cache").insert(
          upcoming.map((event) => ({
            sport: competition.sport,
            competition_id: competitionId,
            odds_api_event_id: event.id,
            player_home: event.homeParticipant,
            player_away: event.awayParticipant,
            commence_at: event.commenceAt,
            status: new Date(event.commenceAt) < now ? "finished" : "scheduled",
            synced_at: new Date().toISOString(),
          }))
        );
        if (insertError) throw new Error(`insertion matchs échouée : ${insertError.message}`);
      }

      eventsCached = upcoming.length;
    } catch (error) {
      errorMessage =
        error instanceof OddsApiUnavailableError || error instanceof Error ? error.message : "Erreur inconnue";
      console.error(`[sync-individual-sports-data] échec pour ${competition.sportKey}`, errorMessage);
    }

    results.push({ sportKey: competition.sportKey, sport: competition.sport, eventsCached, error: errorMessage });
  }

  const summary = {
    ranAt: new Date().toISOString(),
    discovered: discovered.length,
    processed: toProcess.length,
    failed: results.filter((r) => r.error !== null).length,
    totalEventsCached: results.reduce((sum, r) => sum + r.eventsCached, 0),
    details: results,
  };
  console.log("[sync-individual-sports-data] run complete", summary);

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
