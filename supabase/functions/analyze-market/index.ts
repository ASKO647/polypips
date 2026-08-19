import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  extractSlugFromUrl,
  fetchMarketBySlug,
  searchMarketByText,
  MarketNotFoundError,
  GammaUnavailableError,
  type GammaMarket,
} from "./gamma.ts";
import {
  AiServiceError,
  analyzeMarket,
  extractMarketQuestionFromImage,
} from "./anthropic-analysis.ts";

type AnalyzeRequest =
  | { type: "link"; link: string }
  | { type: "image"; imageBase64: string; imageMediaType: string };

/** Steps are reported as they genuinely complete on the server — the
 * frontend renders these events directly instead of simulating delays. */
type ProgressStep = "fetching_market" | "calling_ai" | "receiving_result";

/** Both real plans (decouverte and pro) are full-access, unlimited tiers —
 * mirrors PRICING_PLANS in src/lib/data/pricing.ts, duplicated here because
 * this Edge Function runs on Deno and can't import from the Next.js app's
 * src tree. Keep these two in sync by hand. */
const DAILY_ANALYSIS_LIMITS: Record<string, number | null> = {
  decouverte: null,
  pro: null,
};

/** A user with NO row in `subscriptions` at all (never paid, or a lapsed
 * subscription) still gets to run real analyses up to this ceiling, so the
 * product is provable before paying — this is deliberately independent of
 * the "decouverte" plan's own limits above, which only apply to someone
 * genuinely on that paid 3-day trial. Don't fold this into
 * DAILY_ANALYSIS_LIMITS.decouverte: that plan is unlimited now, and a
 * literal-string fallback collision there would make anonymous non-payers
 * unlimited too. */
const FREE_DEMO_DAILY_LIMIT = 10;

function confidenceLabel(value: string): "Faible" | "Moyenne" | "Élevée" {
  if (value === "Faible" || value === "Moyenne" || value === "Élevée") {
    return value;
  }
  return "Moyenne";
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

  if (
    body.type !== "link" &&
    body.type !== "image"
  ) {
    return new Response(
      JSON.stringify({ error: "invalid_input", message: "Type de requête invalide." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  if (body.type === "link" && (!body.link || typeof body.link !== "string")) {
    return new Response(
      JSON.stringify({ error: "invalid_input", message: "Aucun lien de marché fourni." }),
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
      const emitProgress = (step: ProgressStep) =>
        emit({ type: "progress", step });
      const emitErrorAndClose = (
        code: string,
        message: string
      ) => {
        emit({ type: "error", code, message });
        controller.close();
      };

      const { data: subscriptionRow } = await supabase
        .from("subscriptions")
        .select("plan, status, cancel_at_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      // A cancellation blurs/blocks access immediately (see hasActiveAccess
      // in src/lib/supabase/subscriptions.ts) rather than waiting for the
      // paid period to actually end — mirrored here by hand since this
      // Edge Function can't import that module.
      const hasAccess =
        (subscriptionRow?.status === "active" || subscriptionRow?.status === "trialing") &&
        !subscriptionRow?.cancel_at_period_end;
      const dailyLimit = hasAccess
        ? (DAILY_ANALYSIS_LIMITS[subscriptionRow!.plan] ?? FREE_DEMO_DAILY_LIMIT)
        : FREE_DEMO_DAILY_LIMIT;

      if (dailyLimit !== null) {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from("analyses")
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

      let market: GammaMarket;
      let marketUrl: string | null = null;

      emitProgress("fetching_market");

      if (body.type === "link") {
        marketUrl = body.link;
        const slugs = extractSlugFromUrl(body.link);
        if (!slugs) {
          console.warn(`[analyze-market] format d'URL non reconnu: "${body.link}"`);
          emitErrorAndClose(
            "invalid_input",
            "Ce lien ne ressemble pas à un lien de marché Polymarket valide (format attendu : https://polymarket.com/event/...)."
          );
          return;
        }
        try {
          market = await fetchMarketBySlug(slugs.eventSlug, slugs.marketSlug);
        } catch (error) {
          if (error instanceof MarketNotFoundError) {
            console.error(
              `[gamma:fetchMarketBySlug] marché introuvable pour l'URL "${body.link}" (event="${slugs.eventSlug}", market="${slugs.marketSlug ?? "n/a"}"): ${error.message}`
            );
            emitErrorAndClose("market_not_found", error.message);
          } else if (error instanceof GammaUnavailableError) {
            console.error(`[gamma:fetchMarketBySlug] ${error.message}`);
            emitErrorAndClose(
              "gamma_unavailable",
              "L'API Polymarket est momentanément indisponible. Réessayez dans quelques instants."
            );
          } else {
            console.error("[gamma:fetchMarketBySlug] erreur non typée:", error);
            emitErrorAndClose(
              "gamma_unavailable",
              "Erreur inattendue lors de la récupération des données du marché."
            );
          }
          return;
        }
      } else {
        // Step 1: read the market question from the screenshot — this is an
        // Anthropic call, so its failures must be reported as ai_error, not
        // mistaken for a Gamma/Polymarket outage.
        let question: string | null;
        try {
          question = await extractMarketQuestionFromImage(
            body.imageBase64,
            body.imageMediaType
          );
        } catch (error) {
          // logAnthropicError already logged the precise cause (status, type,
          // message) inside anthropic-analysis.ts for diagnosis in the
          // Supabase function logs — the user only ever sees a generic message.
          console.error(
            `[analyze-market] échec IA pendant la lecture de l'image (${error instanceof AiServiceError ? "appel Anthropic" : "erreur inattendue"})`
          );
          emitErrorAndClose(
            "ai_error",
            "Le service d'analyse IA est temporairement indisponible. Réessayez dans quelques instants."
          );
          return;
        }
        if (!question) {
          emitErrorAndClose(
            "image_unreadable",
            "Impossible de lire une question de marché dans cette image. Essayez avec une capture plus nette ou collez directement le lien du marché."
          );
          return;
        }

        // Step 2: look the question up on Gamma — this is a Polymarket call,
        // so its failures are reported as gamma_unavailable.
        let found: GammaMarket | null;
        try {
          found = await searchMarketByText(question);
        } catch (error) {
          console.error("[gamma:searchMarketByText] erreur non typée:", error);
          emitErrorAndClose(
            "gamma_unavailable",
            "L'API Polymarket est momentanément indisponible. Réessayez dans quelques instants."
          );
          return;
        }
        if (!found) {
          emitErrorAndClose(
            "market_not_identified",
            `Le marché n'a pas pu être identifié automatiquement à partir de l'image (question lue : "${question}"). Merci de coller le lien Polymarket du marché à la place.`
          );
          return;
        }
        market = found;
      }

      emitProgress("calling_ai");

      let verdict;
      try {
        verdict = await analyzeMarket(market, marketUrl);
      } catch (error) {
        // logAnthropicError already logged the precise cause (status, type,
        // message) inside anthropic-analysis.ts for diagnosis in the
        // Supabase function logs — the user only ever sees a generic message.
        console.error(
          `[analyze-market] échec IA pendant la génération du verdict (${error instanceof AiServiceError ? "appel Anthropic" : "erreur inattendue"})`
        );
        emitErrorAndClose(
          "ai_error",
          "Le service d'analyse IA est temporairement indisponible. Réessayez dans quelques instants."
        );
        return;
      }

      emitProgress("receiving_result");

      const marketProbabilityPct = Number.isFinite(market.outcomePrices[0])
        ? Math.round(market.outcomePrices[0] * 100)
        : 50;
      const aiProbability = Math.max(
        0,
        Math.min(100, Math.round(verdict.aiProbability))
      );
      const edge = aiProbability - marketProbabilityPct;
      const opportunityScore = Math.max(
        0,
        Math.min(100, Math.round(verdict.opportunityScore))
      );

      const sources = [
        {
          name: "Polymarket — données de marché en temps réel",
          url: marketUrl ?? "https://polymarket.com",
        },
      ];
      if (market.description) {
        sources.push({
          name: "Règles de résolution du marché",
          url: marketUrl ?? "https://polymarket.com",
        });
      }

      const analysis = {
        id: crypto.randomUUID(),
        question: market.question,
        category: market.category || "Marché",
        analyzedAt: new Date().toISOString(),
        decision: verdict.decision,
        aiProbability,
        marketProbability: marketProbabilityPct,
        edge,
        opportunityScore,
        confidence: confidenceLabel(verdict.confidence),
        explanation: verdict.explanation,
        favorableFactors: verdict.favorableFactors,
        risks: verdict.risks,
        whatCouldChange: verdict.whatCouldChange,
        sources,
      };

      const { error: insertError } = await supabase.from("analyses").insert({
        id: analysis.id,
        user_id: user.id,
        question: analysis.question,
        category: analysis.category,
        market_url: marketUrl,
        // Stored regardless of which flow found the market (link or
        // screenshot) — resolve-markets uses this to re-check the market
        // later without needing to re-parse a URL. Previously only
        // marketUrl was kept, which stays null for the screenshot flow.
        market_slug: market.slug || null,
        decision: analysis.decision,
        ai_probability: analysis.aiProbability,
        market_probability: analysis.marketProbability,
        edge: analysis.edge,
        opportunity_score: analysis.opportunityScore,
        confidence: analysis.confidence,
        explanation: analysis.explanation,
        favorable_factors: analysis.favorableFactors,
        risks: analysis.risks,
        what_could_change: analysis.whatCouldChange,
        sources: analysis.sources,
      });

      if (insertError) {
        console.error("Failed to save analysis", insertError);
      }

      emit({ type: "result", analysis });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    },
  });
});
