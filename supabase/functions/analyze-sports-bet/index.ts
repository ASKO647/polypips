import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { AiServiceError } from "../analyze-market/anthropic-analysis.ts";
import {
  analyzeSportsBet,
  extractBetFromImage,
  type SportsBetInput,
} from "./anthropic-sports-analysis.ts";

/**
 * The Sport universe's "Analyse IA" — analyzes ANY real-world sports bet,
 * ANY sport, ANY bookmaker, submitted by the user (screenshot or manual
 * entry). Deliberately a separate function from analyze-market rather
 * than a generalization of it: no Gamma market to fetch, no
 * market_slug/URL, no automatic resolution later — the model works only
 * from what the user provides plus its own knowledge. See
 * anthropic-sports-analysis.ts's file comment for the fuller reasoning.
 */

type AnalyzeRequest =
  | { type: "manual"; bet: SportsBetInput }
  | { type: "image"; imageBase64: string; imageMediaType: string };

type ProgressStep = "reading_bet" | "calling_ai" | "receiving_result";

/** Own quota, own counter (sports_bet_analyses, not analyses) — this is a
 * distinct product feature from Polymarket's Analyse IA, so a heavy user
 * of one shouldn't crowd out the other's daily allowance. Same limit
 * shape as analyze-market's own for now (unlimited on both real plans,
 * capped for anonymous/lapsed non-payers) — revisit independently if
 * usage patterns diverge. */
const DAILY_ANALYSIS_LIMITS: Record<string, number | null> = {
  decouverte: null,
  pro: null,
};
const FREE_DEMO_DAILY_LIMIT = 10;

function confidenceLabel(value: string): "Faible" | "Moyenne" | "Élevée" {
  if (value === "Faible" || value === "Moyenne" || value === "Élevée") return value;
  return "Moyenne";
}

function isValidBetInput(bet: unknown): bet is SportsBetInput {
  if (!bet || typeof bet !== "object") return false;
  const b = bet as Record<string, unknown>;
  return (
    typeof b.sport === "string" &&
    b.sport.trim() !== "" &&
    typeof b.participants === "string" &&
    b.participants.trim() !== "" &&
    typeof b.betType === "string" &&
    b.betType.trim() !== "" &&
    typeof b.selection === "string" &&
    b.selection.trim() !== "" &&
    typeof b.bookmakerOdds === "string" &&
    b.bookmakerOdds.trim() !== ""
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

  let body: AnalyzeRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid_input", message: "Corps de requête JSON invalide." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (body.type !== "manual" && body.type !== "image") {
    return new Response(
      JSON.stringify({ error: "invalid_input", message: "Type de requête invalide." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  if (body.type === "manual" && !isValidBetInput(body.bet)) {
    return new Response(
      JSON.stringify({
        error: "invalid_input",
        message: "Merci de renseigner le sport, les participants, le type de pari, la sélection et la cote.",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  if (body.type === "image" && (!body.imageBase64 || !body.imageMediaType)) {
    return new Response(
      JSON.stringify({ error: "invalid_input", message: "Image manquante." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

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

      emitProgress("reading_bet");

      let bet: SportsBetInput;
      if (body.type === "manual") {
        bet = body.bet;
      } else {
        let extracted: SportsBetInput | null;
        try {
          extracted = await extractBetFromImage(body.imageBase64, body.imageMediaType);
        } catch (error) {
          console.error(
            `[analyze-sports-bet] échec IA pendant la lecture de l'image (${error instanceof AiServiceError ? "appel Anthropic" : "erreur inattendue"})`
          );
          emitErrorAndClose(
            "ai_error",
            "Le service d'analyse IA est temporairement indisponible. Réessayez dans quelques instants."
          );
          return;
        }
        if (!extracted) {
          emitErrorAndClose(
            "image_unreadable",
            "Impossible d'identifier un pari sportif dans cette image. Essayez une capture plus nette ou saisissez les informations manuellement."
          );
          return;
        }
        bet = extracted;
      }

      emitProgress("calling_ai");

      let verdict;
      try {
        verdict = await analyzeSportsBet(bet);
      } catch (error) {
        console.error(
          `[analyze-sports-bet] échec IA pendant la génération du verdict (${error instanceof AiServiceError ? "appel Anthropic" : "erreur inattendue"})`
        );
        emitErrorAndClose(
          "ai_error",
          "Le service d'analyse IA est temporairement indisponible. Réessayez dans quelques instants."
        );
        return;
      }

      emitProgress("receiving_result");

      const aiProbability = Math.max(0, Math.min(100, Math.round(verdict.aiProbability)));
      const bookmakerImpliedProbability = Math.max(
        0,
        Math.min(100, Math.round(verdict.bookmakerImpliedProbability))
      );
      const edge = aiProbability - bookmakerImpliedProbability;

      const analysis = {
        id: crypto.randomUUID(),
        analyzedAt: new Date().toISOString(),
        sport: bet.sport,
        participants: bet.participants,
        betType: bet.betType,
        selection: bet.selection,
        bookmakerOdds: bet.bookmakerOdds,
        aiProbability,
        bookmakerImpliedProbability,
        edge,
        confidence: confidenceLabel(verdict.confidence),
        explanation: verdict.explanation,
        favorableFactors: verdict.favorableFactors,
        risks: verdict.risks,
        whatCouldChange: verdict.whatCouldChange,
      };

      const { error: insertError } = await supabase.from("sports_bet_analyses").insert({
        id: analysis.id,
        user_id: user.id,
        sport: analysis.sport,
        participants: analysis.participants,
        bet_type: analysis.betType,
        selection: analysis.selection,
        bookmaker_odds: analysis.bookmakerOdds,
        ai_probability: analysis.aiProbability,
        bookmaker_implied_probability: analysis.bookmakerImpliedProbability,
        edge: analysis.edge,
        confidence: analysis.confidence,
        explanation: analysis.explanation,
        favorable_factors: analysis.favorableFactors,
        risks: analysis.risks,
        what_could_change: analysis.whatCouldChange,
      });

      if (insertError) {
        console.error("[analyze-sports-bet] échec de l'enregistrement de l'analyse", insertError);
      }

      emit({ type: "result", analysis });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
});
