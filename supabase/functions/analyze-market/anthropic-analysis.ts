import Anthropic from "npm:@anthropic-ai/sdk@0.116.0";
import type { GammaMarket } from "./gamma.ts";

const client = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
});

/** Thrown for genuine Anthropic API failures (auth, credit, quota, network,
 * server errors) — distinct from Gamma failures and from image-unreadable
 * cases, so the Edge Function can report each source accurately. */
export class AiServiceError extends Error {}

/** Logs the full technical detail of an Anthropic SDK failure server-side
 * (status code, error type, message) so a real cause — insufficient credit,
 * invalid key, rate limit, model outage — is diagnosable from the Supabase
 * function logs without exposing it to the end user. */
function logAnthropicError(context: string, error: unknown): void {
  if (error instanceof Anthropic.APIError) {
    console.error(
      `[anthropic:${context}] status=${error.status} name=${error.name} message=${error.message}`
    );
    return;
  }
  if (error instanceof Error) {
    console.error(`[anthropic:${context}] ${error.name}: ${error.message}`);
    return;
  }
  console.error(`[anthropic:${context}] erreur non typée:`, error);
}

export type AiVerdict = {
  decision: "YES" | "NO";
  aiProbability: number;
  opportunityScore: number;
  confidence: "Faible" | "Moyenne" | "Élevée";
  explanation: string;
  favorableFactors: string[];
  risks: string[];
  whatCouldChange: string;
};

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    decision: { type: "string", enum: ["YES", "NO"] },
    aiProbability: {
      type: "integer",
      description:
        "Probabilité estimée par l'IA (0-100) que l'issue YES du marché se réalise.",
    },
    opportunityScore: {
      type: "integer",
      description:
        "Score d'opportunité (0-100) combinant l'edge, la confiance et la liquidité du marché.",
    },
    confidence: { type: "string", enum: ["Faible", "Moyenne", "Élevée"] },
    explanation: {
      type: "string",
      description:
        "Explication détaillée (3-5 phrases) citant les règles de résolution et les données réelles du marché.",
    },
    favorableFactors: {
      type: "array",
      items: { type: "string" },
      description: "3 à 5 facteurs concrets qui soutiennent la décision.",
    },
    risks: {
      type: "array",
      items: { type: "string" },
      description: "2 à 4 risques concrets qui pourraient invalider l'analyse.",
    },
    whatCouldChange: {
      type: "string",
      description:
        "Un événement concret et plausible qui changerait significativement cette analyse.",
    },
  },
  required: [
    "decision",
    "aiProbability",
    "opportunityScore",
    "confidence",
    "explanation",
    "favorableFactors",
    "risks",
    "whatCouldChange",
  ],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `Tu es l'analyste IA de Polypips, un outil d'aide à la décision pour des marchés de prédiction Polymarket.

Règles impératives :
- Ne présente JAMAIS ta prédiction comme une garantie de résultat. C'est une estimation probabiliste, pas une certitude.
- Reste factuel et probabiliste dans tout ton raisonnement et ton explication.
- Base ton analyse sur les éléments CONCRETS fournis : la question exacte du marché, ses règles de résolution, le prix actuel du marché (probabilité implicite), le volume et la liquidité, la date de clôture, et toute connaissance factuelle pertinente que tu possèdes sur le sujet.
- Cite explicitement dans "explanation" les règles de résolution ou données chiffrées qui motivent ta position, plutôt que des suppositions vagues ou génériques.
- "aiProbability" doit être ton estimation réelle et indépendante de la probabilité de résolution YES, pas une simple copie du prix du marché.
- Si l'information disponible est insuffisante pour trancher avec confiance, dis-le explicitement dans "explanation" et choisis un niveau de confiance "Faible".`;

function buildUserPrompt(market: GammaMarket, marketUrl: string | null): string {
  const outcomeLines = market.outcomes
    .map((outcome, i) => {
      const price = market.outcomePrices[i];
      const pct = Number.isFinite(price) ? `${Math.round(price * 100)}%` : "inconnu";
      return `- ${outcome} : prix actuel ${pct}`;
    })
    .join("\n");

  return `Analyse ce marché Polymarket réel :

QUESTION : ${market.question}

RÈGLES DE RÉSOLUTION :
${market.description?.trim() || "Non fournies par l'API — base-toi sur la question elle-même et tes connaissances générales."}

PRIX ACTUELS DU MARCHÉ (probabilité implicite) :
${outcomeLines || "Non disponibles."}

VOLUME TOTAL ÉCHANGÉ : ${market.volume.toLocaleString("fr-FR")} $
LIQUIDITÉ DISPONIBLE : ${market.liquidity.toLocaleString("fr-FR")} $
DATE DE CLÔTURE : ${market.endDate ?? "non spécifiée"}
STATUT : ${market.closed ? "clôturé" : "actif"}
${marketUrl ? `LIEN : ${marketUrl}` : ""}

La probabilité de marché actuelle pour l'issue "${market.outcomes[0] ?? "YES"}" est d'environ ${
    Number.isFinite(market.outcomePrices[0])
      ? Math.round(market.outcomePrices[0] * 100)
      : "?"
  }%.

Produis ton verdict structuré sur cette issue.`;
}

export async function analyzeMarket(
  market: GammaMarket,
  marketUrl: string | null
): Promise<AiVerdict> {
  let response;
  try {
    response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: {
          type: "json_schema",
          schema: VERDICT_SCHEMA,
        },
      },
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: buildUserPrompt(market, marketUrl) },
      ],
    });
  } catch (error) {
    logAnthropicError("analyzeMarket", error);
    throw new AiServiceError("Échec de l'appel à l'API Anthropic pour le verdict d'analyse.");
  }

  if (response.stop_reason === "refusal") {
    console.error(
      `[anthropic:analyzeMarket] refus de contenu — category=${response.stop_details?.category ?? "inconnue"}`
    );
    throw new AiServiceError(
      "L'IA a refusé d'analyser ce marché (contenu potentiellement sensible)."
    );
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    console.error("[anthropic:analyzeMarket] réponse sans bloc texte exploitable", response);
    throw new AiServiceError("Réponse de l'IA vide ou inattendue.");
  }

  try {
    return JSON.parse(textBlock.text) as AiVerdict;
  } catch (error) {
    console.error("[anthropic:analyzeMarket] JSON invalide dans la réponse:", textBlock.text, error);
    throw new AiServiceError("Réponse de l'IA mal formée.");
  }
}

/** Reads the market question directly from a screenshot using vision, so we
 * can then look the market up on the Gamma API for real numeric data. */
export async function extractMarketQuestionFromImage(
  imageBase64: string,
  mediaType: string
): Promise<string | null> {
  let response;
  try {
    response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 256,
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: "Cette image est une capture d'écran d'un marché Polymarket. Réponds UNIQUEMENT avec la question exacte du marché telle qu'affichée (aucune phrase d'introduction, aucune ponctuation supplémentaire). Si aucune question de marché n'est lisible, réponds exactement: INTROUVABLE",
            },
          ],
        },
      ],
    });
  } catch (error) {
    logAnthropicError("extractMarketQuestionFromImage", error);
    throw new AiServiceError(
      "Échec de l'appel à l'API Anthropic pour la lecture de l'image."
    );
  }

  // A refusal or unreadable image is a content-level outcome, not an API
  // failure — surfaced to the caller as "no question found" (image_unreadable),
  // not as an ai_error.
  if (response.stop_reason === "refusal") return null;

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  const text = textBlock.text.trim();
  if (!text || text === "INTROUVABLE") return null;
  return text;
}
