import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { AiServiceError } from "../analyze-market/anthropic-analysis.ts";
import {
  analyzeSportMatch,
  type RecentMeeting,
  type SportMatchInput,
} from "./anthropic-sport-match-analysis.ts";

/**
 * The Sport universe's "Analyse IA", step 2 — see
 * anthropic-sport-match-analysis.ts's file comment. Reuses
 * sports_bet_analyses (migrated to make the old bookmaker-odds columns
 * nullable) rather than a new table, so "Mes analyses" stays one history.
 */

type ProgressStep = "calling_ai" | "receiving_result";

const DAILY_ANALYSIS_LIMITS: Record<string, number | null> = {
  decouverte: null,
  pro: null,
};
const FREE_DEMO_DAILY_LIMIT = 10;

function confidenceLabel(value: string): "Faible" | "Moyenne" | "Élevée" {
  if (value === "Faible" || value === "Moyenne" || value === "Élevée") return value;
  return "Moyenne";
}

function isValidMeeting(m: unknown): m is RecentMeeting {
  if (!m || typeof m !== "object") return false;
  const r = m as Record<string, unknown>;
  return (
    typeof r.kickoffAt === "string" &&
    typeof r.homeTeamName === "string" &&
    typeof r.awayTeamName === "string" &&
    (typeof r.homeScore === "number" || r.homeScore === null) &&
    (typeof r.awayScore === "number" || r.awayScore === null) &&
    (typeof r.competitionName === "string" || r.competitionName === null)
  );
}

function isValidInput(body: unknown): body is SportMatchInput {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    (b.sport === "football" || b.sport === "basketball") &&
    typeof b.homeTeamName === "string" &&
    b.homeTeamName.trim() !== "" &&
    typeof b.awayTeamName === "string" &&
    b.awayTeamName.trim() !== "" &&
    (typeof b.competitionName === "string" || b.competitionName === null) &&
    typeof b.kickoffAt === "string" &&
    !Number.isNaN(new Date(b.kickoffAt).getTime()) &&
    Array.isArray(b.recentMeetings) &&
    b.recentMeetings.every(isValidMeeting)
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "method_not_allowed", message: "Méthode non supportée." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "unauthorized", message: "Authentification requise." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "unauthorized", message: "Session invalide ou expirée." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid_input", message: "Corps de requête JSON invalide." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!isValidInput(body)) {
    return new Response(
      JSON.stringify({
        error: "invalid_input",
        message: "Merci de fournir un match valide (sport, équipes, date).",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const input = body;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(payload) + "\n"));
      };
      const emitProgress = (step: ProgressStep) => emit({ type: "progress", step });
      const emitErrorAndClose = (code: string, message: string) => {
        emit({ type: "error", code, message });
        controller.close();
      };

      const { data: subscriptionRow } = await supabase
        .from("subscriptions")
        .select("plan, status, cancel_at_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      const hasAccess =
        (subscriptionRow?.status === "active" || subscriptionRow?.status === "trialing") &&
        !subscriptionRow?.cancel_at_period_end;
      const dailyLimit = hasAccess
        ? (DAILY_ANALYSIS_LIMITS[subscriptionRow!.plan] ?? FREE_DEMO_DAILY_LIMIT)
        : FREE_DEMO_DAILY_LIMIT;

      if (dailyLimit !== null) {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from("sports_bet_analyses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", since);

        if ((count ?? 0) >= dailyLimit) {
          emitErrorAndClose(
            "limit_reached",
            hasAccess
              ? `Vous avez atteint votre limite de ${dailyLimit} analyses aujourd'hui.`
              : `Vous avez atteint votre limite de ${dailyLimit} analyses gratuites. Débutez pour 0,99 € pour des analyses illimitées.`
          );
          return;
        }
      }

      emitProgress("calling_ai");

      let verdict;
      try {
        verdict = await analyzeSportMatch(input);
      } catch (error) {
        console.error(
          `[analyze-sport-match] échec IA pendant la génération du pronostic (${error instanceof AiServiceError ? "appel Anthropic" : "erreur inattendue"})`
        );
        emitErrorAndClose(
          "ai_error",
          "Le service d'analyse IA est temporairement indisponible. Réessayez dans quelques instants."
        );
        return;
      }

      emitProgress("receiving_result");

      const aiProbability = Math.max(0, Math.min(100, Math.round(verdict.aiProbability)));

      const analysis = {
        id: crypto.randomUUID(),
        analyzedAt: new Date().toISOString(),
        sport: input.sport,
        participants: `${input.homeTeamName} vs ${input.awayTeamName}`,
        competition: input.competitionName,
        matchDate: input.kickoffAt,
        predictedWinner: verdict.predictedWinner,
        aiProbability,
        confidence: confidenceLabel(verdict.confidence),
        explanation: verdict.explanation,
        favorableFactors: verdict.favorableFactors,
        risks: verdict.risks,
        whatCouldChange: verdict.whatCouldChange,
        secondaryMarkets: verdict.secondaryMarkets,
      };

      const { error: insertError } = await supabase.from("sports_bet_analyses").insert({
        id: analysis.id,
        user_id: user.id,
        sport: analysis.sport,
        participants: analysis.participants,
        competition: analysis.competition,
        match_date: analysis.matchDate,
        predicted_winner: analysis.predictedWinner,
        ai_probability: analysis.aiProbability,
        confidence: analysis.confidence,
        explanation: analysis.explanation,
        favorable_factors: analysis.favorableFactors,
        risks: analysis.risks,
        what_could_change: analysis.whatCouldChange,
        secondary_markets: analysis.secondaryMarkets,
      });

      if (insertError) {
        console.error("[analyze-sport-match] échec de l'enregistrement de l'analyse", insertError);
      }

      emit({ type: "result", analysis });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
});
