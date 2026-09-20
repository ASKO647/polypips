import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { AiServiceError } from "../analyze-market/anthropic-analysis.ts";
import { analyzeTradingChart, type AnalysisDepth } from "./anthropic-trading-analysis.ts";
import {
  consumeDeepAnalysisCredit,
  refundDeepAnalysisCredit,
  InsufficientCreditsError,
} from "../_shared/deep-analysis-credits.ts";
import { DAILY_ANALYSIS_LIMITS, countCombinedDailyAnalyses } from "../_shared/plan-quotas.ts";

function parseDepth(value: unknown): AnalysisDepth {
  return value === "deep" ? "deep" : "standard";
}

/**
 * The Trading universe's "Analyse IA" — a screenshot of a trading chart in,
 * a structured recommendation out. Own table (trading_chart_analyses), but
 * its standard-analysis daily quota is COMBINED with Polymarket's and
 * Sport's into one shared counter for the Pro/decouverte tiers — see
 * countCombinedDailyAnalyses in _shared/plan-quotas.ts.
 */

type ProgressStep = "calling_ai" | "receiving_result";

const FREE_DEMO_DAILY_LIMIT = 10;

const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

type AnalyzeRequest = { imageBase64: string; imageMediaType: string; depth?: AnalysisDepth };

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
  const depth = parseDepth(input.depth);
  const analysisId = crypto.randomUUID();

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

      // Analyse Approfondie bypasses the daily quota entirely — it's
      // credit-gated instead, checked further down right before the AI
      // call. The standard flow's quota is untouched.
      if (depth === "standard") {
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
          // Combined across Polymarket/Sport/Trading — one shared quota,
          // not one per universe. See plan-quotas.ts.
          const count = await countCombinedDailyAnalyses(authHeader, user.id);

          if (count >= dailyLimit) {
            emitErrorAndClose(
              "limit_reached",
              hasAccess
                ? `Vous avez atteint votre limite de ${dailyLimit} analyses aujourd'hui.`
                : `Vous avez atteint votre limite de ${dailyLimit} analyses gratuites. Débutez pour 0,99 € pour des analyses illimitées.`
            );
            return;
          }
        }
      } else {
        try {
          await consumeDeepAnalysisCredit(user.id, analysisId);
        } catch (error) {
          if (error instanceof InsufficientCreditsError) {
            emitErrorAndClose(
              "no_credits",
              "Vous n'avez plus de crédits pour l'Analyse Approfondie. Achetez un pack ou parrainez un ami pour en obtenir gratuitement."
            );
            return;
          }
          console.error("[analyze-trading-chart] échec de la consommation du crédit", error);
          emitErrorAndClose(
            "ai_error",
            "Le service d'analyse IA est temporairement indisponible. Réessayez dans quelques instants."
          );
          return;
        }
      }

      emitProgress("calling_ai");

      let verdict;
      try {
        verdict = await analyzeTradingChart(input.imageBase64, input.imageMediaType, depth);
      } catch (error) {
        console.error(
          `[analyze-trading-chart] échec IA pendant la lecture du graphique (${error instanceof AiServiceError ? "appel Anthropic" : "erreur inattendue"})`
        );
        if (depth === "deep") await refundDeepAnalysisCredit(user.id, analysisId);
        emitErrorAndClose(
          "ai_error",
          "Le service d'analyse IA est temporairement indisponible. Réessayez dans quelques instants."
        );
        return;
      }

      emitProgress("receiving_result");

      const analysis = {
        id: analysisId,
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
        isDeep: depth === "deep",
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
        is_deep: analysis.isDeep,
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
