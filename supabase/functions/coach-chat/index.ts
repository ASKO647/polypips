import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { AiServiceError, streamCoachReply, type ChatMessage } from "./anthropic-chat.ts";

type ChatRequest = {
  conversationId: string | null;
  message: string;
  focusAnalysisId?: string;
};

type AnalysisRow = {
  id: string;
  question: string;
  category: string;
  decision: "YES" | "NO";
  ai_probability: number;
  market_probability: number;
  edge: number;
  opportunity_score: number;
  confidence: "Faible" | "Moyenne" | "Élevée";
  explanation: string;
  favorable_factors: string[];
  risks: string[];
  what_could_change: string;
  created_at: string;
};

/** Mirrors getWeeklyCoachMessageLimit(PRICING_PLANS) in
 * src/lib/data/pricing.ts — duplicated here because this Edge Function runs
 * on Deno and can't import from the Next.js app's src tree. Keep these two
 * in sync by hand. A user with no row in `subscriptions` (or a lapsed one)
 * is treated as the "decouverte" free-tier ceiling, same policy as the
 * daily analysis limit in analyze-market/index.ts. */
const WEEKLY_MESSAGE_LIMITS: Record<string, number | null> = {
  decouverte: 50,
  pro: 50,
  "pro-plus": null,
};

const SYSTEM_PROMPT_BASE = `Tu es le Coach IA de Polypips, un assistant qui aide les utilisateurs à comprendre les analyses de marchés de prédiction (Polymarket) déjà produites par Polypips, à comparer des marchés entre eux et à discuter des risques.

Règles impératives :
- Ne présente JAMAIS un résultat futur comme garanti. Reste toujours au conditionnel et en termes probabilistes ("le modèle estimait", "cela suggère", "le risque principal serait").
- Base tes réponses sur les analyses réelles fournies ci-dessous (contexte des analyses de l'utilisateur), pas sur des données inventées.
- Si l'utilisateur demande quelque chose qui sort du contexte fourni (un marché jamais analysé, par exemple), dis-le clairement plutôt que d'improviser des chiffres.
- Réponds en français, de façon concise et directe (quelques phrases ou une courte liste), sauf si l'utilisateur demande explicitement plus de détail.`;

function deriveTitle(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 48) return trimmed;
  return trimmed.slice(0, 48).replace(/\s+\S*$/, "") + "…";
}

function formatCompactAnalysis(row: AnalysisRow): string {
  const when = new Date(row.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
  return `- [${row.category}] "${row.question}" — Décision IA: ${row.decision} ${row.ai_probability}% (marché ${row.market_probability}%, edge ${row.edge >= 0 ? "+" : ""}${row.edge}%) — ${when}`;
}

function formatFocusAnalysis(row: AnalysisRow): string {
  return `QUESTION : ${row.question}
CATÉGORIE : ${row.category}
DÉCISION IA : ${row.decision} — probabilité IA ${row.ai_probability}% (marché ${row.market_probability}%, edge ${row.edge >= 0 ? "+" : ""}${row.edge}%)
SCORE D'OPPORTUNITÉ : ${row.opportunity_score}/100 — CONFIANCE : ${row.confidence}
EXPLICATION DÉJÀ DONNÉE : ${row.explanation}
FACTEURS FAVORABLES : ${row.favorable_factors.join("; ")}
RISQUES : ${row.risks.join("; ")}
CE QUI POURRAIT FAIRE CHANGER L'ANALYSE : ${row.what_could_change}`;
}

function buildSystemPrompt(
  recentAnalyses: AnalysisRow[],
  focusAnalysis: AnalysisRow | null
): string {
  let prompt = SYSTEM_PROMPT_BASE;

  if (focusAnalysis) {
    prompt += `\n\nL'utilisateur arrive sur cette conversation depuis le résultat détaillé de l'analyse suivante — priorise ce contexte pour sa première question :\n${formatFocusAnalysis(focusAnalysis)}`;
  }

  const others = focusAnalysis
    ? recentAnalyses.filter((a) => a.id !== focusAnalysis.id)
    : recentAnalyses;

  if (others.length > 0) {
    prompt += `\n\nRésumé des analyses récentes de cet utilisateur (les plus récentes) :\n${others
      .map(formatCompactAnalysis)
      .join("\n")}`;
  } else if (!focusAnalysis) {
    prompt += `\n\nCet utilisateur n'a encore aucune analyse enregistrée — s'il pose une question sur un marché précis, invite-le à d'abord lancer une analyse depuis la page Analyse IA.`;
  }

  return prompt;
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

  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid_input", message: "Corps de requête JSON invalide." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
    return new Response(
      JSON.stringify({ error: "invalid_input", message: "Message vide." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  const userMessage = body.message.trim();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(payload) + "\n"));
      };
      const emitErrorAndClose = (code: string, message: string) => {
        emit({ type: "error", code, message });
        controller.close();
      };

      // ----- 1. Weekly usage limit -----
      const { data: subscriptionRow } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", user.id)
        .maybeSingle();

      const hasAccess =
        subscriptionRow?.status === "active" || subscriptionRow?.status === "trialing";
      const effectivePlan = hasAccess ? subscriptionRow!.plan : "decouverte";
      const weeklyLimit = WEEKLY_MESSAGE_LIMITS[effectivePlan] ?? 50;

      if (weeklyLimit !== null) {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from("coach_messages")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("role", "user")
          .gte("created_at", since);

        if ((count ?? 0) >= weeklyLimit) {
          emitErrorAndClose(
            "limit_reached",
            `Vous avez atteint votre limite de ${weeklyLimit} messages Coach IA cette semaine. Passez à Pro+ pour des messages illimités.`
          );
          return;
        }
      }

      // ----- 2. Resolve or create the conversation -----
      let conversationId = body.conversationId;
      let conversationTitle: string;

      if (conversationId) {
        const { data: existing } = await supabase
          .from("coach_conversations")
          .select("id, title")
          .eq("id", conversationId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!existing) {
          emitErrorAndClose("invalid_input", "Conversation introuvable.");
          return;
        }
        conversationTitle = existing.title;
      } else {
        const { data: created, error: createError } = await supabase
          .from("coach_conversations")
          .insert({ user_id: user.id, title: deriveTitle(userMessage) })
          .select("id, title")
          .single();
        if (createError || !created) {
          console.error("[coach-chat] failed to create conversation", createError);
          emitErrorAndClose("unknown", "Impossible de démarrer la conversation. Réessayez.");
          return;
        }
        conversationId = created.id;
        conversationTitle = created.title;
      }

      // ----- 3. Persist the user's message -----
      const { error: userMsgError } = await supabase.from("coach_messages").insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: "user",
        content: userMessage,
      });
      if (userMsgError) {
        console.error("[coach-chat] failed to save user message", userMsgError);
      }

      // ----- 4. Build context: recent analyses + optional focused one -----
      const { data: recentAnalyses } = await supabase
        .from("analyses")
        .select(
          "id, question, category, decision, ai_probability, market_probability, edge, opportunity_score, confidence, explanation, favorable_factors, risks, what_could_change, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(18);

      let focusAnalysis: AnalysisRow | null = null;
      if (body.focusAnalysisId) {
        const { data: focused } = await supabase
          .from("analyses")
          .select(
            "id, question, category, decision, ai_probability, market_probability, edge, opportunity_score, confidence, explanation, favorable_factors, risks, what_could_change, created_at"
          )
          .eq("id", body.focusAnalysisId)
          .eq("user_id", user.id)
          .maybeSingle();
        focusAnalysis = (focused as AnalysisRow | null) ?? null;
      }

      const systemPrompt = buildSystemPrompt(
        (recentAnalyses as AnalysisRow[] | null) ?? [],
        focusAnalysis
      );

      // ----- 5. Full conversation history for this thread -----
      const { data: history } = await supabase
        .from("coach_messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      const messages: ChatMessage[] = ((history as ChatMessage[] | null) ?? []).map(
        (m) => ({ role: m.role, content: m.content })
      );

      // ----- 6. Stream the reply -----
      let fullText: string;
      try {
        fullText = await streamCoachReply(systemPrompt, messages, (delta) => {
          emit({ type: "delta", text: delta });
        });
      } catch (error) {
        console.error(
          `[coach-chat] échec IA (${error instanceof AiServiceError ? "appel Anthropic" : "erreur inattendue"})`
        );
        emitErrorAndClose(
          "ai_error",
          "Le service d'assistance IA est temporairement indisponible. Réessayez dans quelques instants."
        );
        return;
      }

      // ----- 7. Persist the assistant's reply -----
      const { error: assistantMsgError } = await supabase.from("coach_messages").insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: "assistant",
        content: fullText,
      });
      if (assistantMsgError) {
        console.error("[coach-chat] failed to save assistant message", assistantMsgError);
      }

      await supabase
        .from("coach_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      emit({ type: "done", conversationId, title: conversationTitle });
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
