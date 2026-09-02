import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { AiServiceError } from "../analyze-market/anthropic-analysis.ts";
import { analyzeTradingChart } from "./anthropic-trading-analysis.ts";

/**
 * The Trading universe's "Analyse IA" — a screenshot of a trading chart in,
 * a structured recommendation out. Own table (trading_chart_analyses) and
 * own daily-quota counter, same "one product surface, one counter" pattern
 * already used for Polymarket's `analyses` and Sport's
 * `sports_bet_analyses` — never sharing a counter across unrelated
 * features. Same limit numbers as those two, though (10/day free demo,
 * unlimited on both paid plans): there's no product reason for Trading to
 * have a different daily cap.
 */

type ProgressStep = "calling_ai" | "receiving_result";

const DAILY_ANALYSIS_LIMITS: Record<string, number | null> = {
  decouverte: null,
  pro: null,
};
const FREE_DEMO_DAILY_LIMIT = 10;

const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

type AnalyzeRequest = { imageBase64: string; imageMediaType: string };

function isValidInput(body: unknown): body is AnalyzeRequest {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.imageBase64 === "string" &&
    b.imageBase64.trim() !== "" &&
    typeof b.imageMediaType === "string" &&
    ALLOWED_MEDIA_TYPES.has(b.imageMediaType)
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
        message: "Merci de fournir une image de graphique valide (JPEG, PNG, GIF ou WebP).",
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
          .from("trading_chart_analyses")
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
        verdict = await analyzeTradingChart(input.imageBase64, input.imageMediaType);
      } catch (error) {
        console.error(
          `[analyze-trading-chart] échec IA pendant la lecture du graphique (${error instanceof AiServiceError ? "appel Anthropic" : "erreur inattendue"})`
        );
        emitErrorAndClose(
          "ai_error",
          "Le service d'analyse IA est temporairement indisponible. Réessayez dans quelques instants."
        );
        return;
      }

      emitProgress("receiving_result");

      const analysis = {
        id: crypto.randomUUID(),
        analyzedAt: new Date().toISOString(),
        instrument: verdict.instrument,
        timeframe: verdict.timeframe,
        recommendation: verdict.recommendation,
        confidence: verdict.confidence,
        trendAnalysis: verdict.trendAnalysis,
        keyLevels: verdict.keyLevels,
        indicatorsObserved: verdict.indicatorsObserved,
        takeProfit: verdict.takeProfit,
        stopLoss: verdict.stopLoss,
        explanation: verdict.explanation,
        risks: verdict.risks,
      };

      const { error: insertError } = await supabase.from("trading_chart_analyses").insert({
        id: analysis.id,
        user_id: user.id,
        instrument: analysis.instrument,
        timeframe: analysis.timeframe,
        recommendation: analysis.recommendation,
        confidence: analysis.confidence,
        trend_analysis: analysis.trendAnalysis,
        key_levels: analysis.keyLevels,
        indicators_observed: analysis.indicatorsObserved,
        take_profit: analysis.takeProfit,
        stop_loss: analysis.stopLoss,
        explanation: analysis.explanation,
        risks: analysis.risks,
      });

      if (insertError) {
        console.error("[analyze-trading-chart] échec de l'enregistrement de l'analyse", insertError);
      }

      emit({ type: "result", analysis });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
});
