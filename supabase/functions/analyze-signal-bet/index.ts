import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { AiServiceError } from "../analyze-market/anthropic-analysis.ts";
import {
  analyzeSignalBet,
  extractSignalFromImage,
  type SignalBetInput,
} from "./anthropic-signal-analysis.ts";

/**
 * The Smart Wallets universe's "Analyse IA" (Fomo/Axiom) — analyzes ONE
 * memecoin wallet trade, screenshot or manual entry. Own Edge Function
 * and own table (signal_ai_analyses), same reasoning as
 * analyze-sports-bet: no shared data with Polymarket's analyze-market, no
 * automatic resolution later.
 *
 * A third input type, "link", is intentionally NOT a live fetch: neither
 * Fomo nor Axiom expose a documented public/commercial API (see
 * _shared/signal-providers' file comments), and this project does not
 * scrape either site. Pasting a link is still accepted by the frontend —
 * it's stored for reference — but this function returns "link_unavailable"
 * for a link-only submission rather than fabricating an analysis from a
 * page it cannot actually read; the user is guided to switch to
 * screenshot or manual entry for a real analysis.
 */

type AnalyzeRequest =
  | { type: "manual"; source: "fomo" | "axiom"; bet: SignalBetInput }
  | { type: "image"; source: "fomo" | "axiom"; imageBase64: string; imageMediaType: string }
  | { type: "link"; source: "fomo" | "axiom"; link: string };

type ProgressStep = "reading_trade" | "calling_ai" | "receiving_result";

/** Own quota, own counter (signal_ai_analyses) — distinct from both
 * Polymarket's analyze-market and Sport's analyze-sports-bet, same shape:
 * unlimited on both real plans, capped for anonymous/lapsed non-payers. */
const DAILY_ANALYSIS_LIMITS: Record<string, number | null> = {
  decouverte: null,
  pro: null,
};
const FREE_DEMO_DAILY_LIMIT = 10;

function isValidBetInput(bet: unknown): bet is SignalBetInput {
  if (!bet || typeof bet !== "object") return false;
  const b = bet as Record<string, unknown>;
  return (
    typeof b.tokenSymbol === "string" &&
    b.tokenSymbol.trim() !== "" &&
    (b.side === "BUY" || b.side === "SELL") &&
    typeof b.amountUsd === "string" &&
    b.amountUsd.trim() !== ""
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

  if (body.type !== "manual" && body.type !== "image" && body.type !== "link") {
    return new Response(
      JSON.stringify({ error: "invalid_input", message: "Type de requête invalide." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  if (body.source !== "fomo" && body.source !== "axiom") {
    return new Response(
      JSON.stringify({ error: "invalid_input", message: "Source invalide." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  if (body.type === "manual" && !isValidBetInput(body.bet)) {
    return new Response(
      JSON.stringify({
        error: "invalid_input",
        message: "Merci de renseigner au minimum le token, le sens (achat/vente) et le montant.",
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
  if (body.type === "link" && (!body.link || body.link.trim() === "")) {
    return new Response(
      JSON.stringify({ error: "invalid_input", message: "Lien manquant." }),
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

      // Link-only submissions never reach the AI — see this file's
      // comment on why a pasted Fomo/Axiom link can't be fetched.
      if (body.type === "link") {
        emitErrorAndClose(
          "link_unavailable",
          "Polypips ne peut pas encore récupérer automatiquement les données d'un lien Fomo/Axiom (aucune API officielle disponible). Déposez une capture d'écran de cette page, ou saisissez les informations manuellement, pour une analyse basée sur des données réelles."
        );
        return;
      }

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
          .from("signal_ai_analyses")
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

      emitProgress("reading_trade");

      let bet: SignalBetInput;
      if (body.type === "manual") {
        bet = { ...body.bet, source: body.source };
      } else {
        let extracted: SignalBetInput | null;
        try {
          extracted = await extractSignalFromImage(body.imageBase64, body.imageMediaType);
        } catch (error) {
          console.error(
            `[analyze-signal-bet] échec IA pendant la lecture de l'image (${error instanceof AiServiceError ? "appel Anthropic" : "erreur inattendue"})`
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
            "Impossible d'identifier un trade dans cette image. Essayez une capture plus nette ou saisissez les informations manuellement."
          );
          return;
        }
        bet = { ...extracted, source: body.source };
      }

      emitProgress("calling_ai");

      let verdict;
      try {
        verdict = await analyzeSignalBet(bet);
      } catch (error) {
        console.error(
          `[analyze-signal-bet] échec IA pendant la génération du verdict (${error instanceof AiServiceError ? "appel Anthropic" : "erreur inattendue"})`
        );
        emitErrorAndClose(
          "ai_error",
          "Le service d'analyse IA est temporairement indisponible. Réessayez dans quelques instants."
        );
        return;
      }

      emitProgress("receiving_result");

      const polypipsScore = Math.max(0, Math.min(100, Math.round(verdict.polypipsScore)));
      const numOrNull = (value: string) => {
        const n = Number(value.replace(/[^0-9.-]/g, ""));
        return value.trim() === "" || Number.isNaN(n) ? null : n;
      };

      const analysis = {
        id: crypto.randomUUID(),
        analyzedAt: new Date().toISOString(),
        source: bet.source,
        walletAddress: bet.walletAddress || null,
        tokenSymbol: bet.tokenSymbol,
        side: bet.side,
        amountUsd: numOrNull(bet.amountUsd),
        price: numOrNull(bet.price),
        marketCap: numOrNull(bet.marketCap),
        liquidity: numOrNull(bet.liquidity),
        volume24h: numOrNull(bet.volume24h),
        polypipsScore,
        summary: verdict.summary,
        positives: verdict.positives,
        risks: verdict.risks,
        conclusion: verdict.conclusion,
        decision: verdict.decision === "COPY" ? "copie" : "ignore",
      };

      const { error: insertError } = await supabase.from("signal_ai_analyses").insert({
        id: analysis.id,
        user_id: user.id,
        source: analysis.source,
        input_mode: body.type,
        wallet_address: analysis.walletAddress,
        token_symbol: analysis.tokenSymbol,
        side: analysis.side,
        amount_usd: analysis.amountUsd,
        price: analysis.price,
        market_cap: analysis.marketCap,
        liquidity: analysis.liquidity,
        volume_24h: analysis.volume24h,
        polypips_score: analysis.polypipsScore,
        summary: analysis.summary,
        positives: analysis.positives,
        risks: analysis.risks,
        key_data: {
          amountUsd: bet.amountUsd,
          price: bet.price,
          marketCap: bet.marketCap,
          liquidity: bet.liquidity,
          volume24h: bet.volume24h,
        },
        conclusion: analysis.conclusion,
        decision: analysis.decision,
      });

      if (insertError) {
        console.error("[analyze-signal-bet] échec de l'enregistrement de l'analyse", insertError);
      }

      emit({ type: "result", analysis });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
});
