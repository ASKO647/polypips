import Anthropic from "npm:@anthropic-ai/sdk@0.116.0";
import type { GammaMarket } from "./gamma.ts";

const client = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
});

/** Thrown for genuine Anthropic API failures (auth, credit, quota, network,
 * server errors) — distinct from Gamma failures and from image-unreadable
 * cases, so the Edge Function can report each source accurately. */
export class AiServiceError extends Error {}

/** Internal-only: a response that came back but isn't usable (degenerate
 * repetition, invalid JSON) — as opposed to AiServiceError, which is a
 * failed call. Never escapes analyzeMarket(); it's what triggers the one
 * retry, and is converted to AiServiceError if the retry also fails, so
 * callers only ever see the one error type they already handle. */
class MalformedVerdictError extends Error {}

/** Same string, repeated a large number of times in a row, with no other
 * content in between — matches both a bare character run ("aaaa...") and a
 * repeated short token ("a a a a..."). Group length is capped at 12 chars
 * to keep the backreference cheap to check, and the whole thing only ever
 * runs once per response. 20+ consecutive repeats of anything is not
 * something real analysis prose produces. */
const DEGENERATE_REPETITION_PATTERN = /(.{1,12})\1{19,}/;

function hasDegenerateRepetition(text: string): boolean {
  return DEGENERATE_REPETITION_PATTERN.test(text);
}

/** Keeps a log line readable when the text itself is the problem (a
 * runaway repetition can be thousands of characters long). */
function truncateForLog(text: string, maxLength = 800): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}… [${text.length - maxLength} caractères tronqués]`;
}

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
  /** The market's own real outcome label the AI picked (e.g. "Yes", "Up",
   * "Manchester United") — never a hardcoded "YES"/"NO": the JSON schema
   * sent to Anthropic constrains this to exactly the two labels Gamma
   * returned for the specific market being analyzed (see
   * buildVerdictSchema), so the model is structurally unable to answer
   * with anything else. */
  decision: string;
  aiProbability: number;
  opportunityScore: number;
  confidence: "Faible" | "Moyenne" | "Élevée";
  explanation: string;
  favorableFactors: string[];
  risks: string[];
  whatCouldChange: string;
};

/** Most Polymarket markets ARE Yes/No, but a real minority — crypto price
 * markets ("Up"/"Down") chief among them — use different label pairs on
 * the exact same binary (always-exactly-2-outcomes) market shape; true
 * 3+-option single markets aren't a thing on Polymarket (a multi-choice
 * *event* like an election is actually N separate Yes/No sub-markets, one
 * per candidate — see gamma.ts's fetchMarketBySlug, which already picks
 * one specific sub-market). So this only ever needs to constrain a binary
 * choice — just not a hardcoded one. Falls back to a generic Oui/Non pair
 * only for the rare malformed-market case where Gamma didn't return two
 * real outcome labels, so the schema (and the rest of the pipeline) never
 * breaks on that edge case. */
function effectiveOutcomes(market: GammaMarket): [string, string] {
  const [a, b] = market.outcomes;
  if (a && b) return [a, b];
  return ["Oui", "Non"];
}

function buildVerdictSchema(outcomes: [string, string]) {
  return {
    type: "object",
    properties: {
      decision: {
        type: "string",
        enum: outcomes,
        description: `L'issue que tu retiens comme la plus probable, EXACTEMENT l'un de ces deux libellés réels du marché : "${outcomes[0]}" ou "${outcomes[1]}".`,
      },
      aiProbability: {
        type: "integer",
        description: `Probabilité estimée par l'IA (0-100) que l'issue "${outcomes[0]}" du marché se réalise (pas "decision" — toujours la même issue de référence, quelle que soit ta décision finale).`,
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
}

const SYSTEM_PROMPT = `Tu es l'analyste IA de Polypips, un outil d'aide à la décision pour des marchés de prédiction Polymarket.

Règles impératives :
- Ne présente JAMAIS ta prédiction comme une garantie de résultat. C'est une estimation probabiliste, pas une certitude.
- Reste factuel et probabiliste dans tout ton raisonnement et ton explication.
- Base ton analyse sur les éléments CONCRETS fournis : la question exacte du marché, ses règles de résolution, le prix actuel du marché (probabilité implicite), le volume et la liquidité, la date de clôture, et toute connaissance factuelle pertinente que tu possèdes sur le sujet.
- Cite explicitement dans "explanation" les règles de résolution ou données chiffrées qui motivent ta position, plutôt que des suppositions vagues ou génériques.
- Chaque marché a ses propres libellés d'issue réels (souvent "Yes"/"No", mais pas toujours — par exemple "Up"/"Down" sur un marché de prix crypto). "decision" doit être EXACTEMENT l'un des deux libellés fournis dans le message utilisateur, jamais "YES"/"NO" par défaut ni une reformulation.
- "aiProbability" doit être ton estimation réelle et indépendante de la probabilité que la PREMIÈRE issue mentionnée dans le message utilisateur se réalise, pas une simple copie du prix du marché.
- Si l'information disponible est insuffisante pour trancher avec confiance, dis-le explicitement dans "explanation" et choisis un niveau de confiance "Faible".`;

function buildUserPrompt(market: GammaMarket, marketUrl: string | null, outcomes: [string, string]): string {
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

ISSUES POSSIBLES DE CE MARCHÉ (libellés réels, choisis "decision" EXACTEMENT parmi ces deux-là) :
${outcomeLines || `- ${outcomes[0]}\n- ${outcomes[1]} (prix non disponibles)`}

VOLUME TOTAL ÉCHANGÉ : ${market.volume.toLocaleString("fr-FR")} $
LIQUIDITÉ DISPONIBLE : ${market.liquidity.toLocaleString("fr-FR")} $
DATE DE CLÔTURE : ${market.endDate ?? "non spécifiée"}
STATUT : ${market.closed ? "clôturé" : "actif"}
${marketUrl ? `LIEN : ${marketUrl}` : ""}

La probabilité de marché actuelle pour l'issue "${outcomes[0]}" est d'environ ${
    Number.isFinite(market.outcomePrices[0])
      ? Math.round(market.outcomePrices[0] * 100)
      : "?"
  }%.

Produis ton verdict structuré. Pour "decision", réponds EXACTEMENT "${outcomes[0]}" ou "${outcomes[1]}" — aucune autre valeur n'est acceptée.`;
}

/** One attempt at getting a usable verdict. Throws AiServiceError for a
 * failed/refused call (not worth retrying — see analyzeMarket), or
 * MalformedVerdictError for a call that succeeded but came back unusable
 * (degenerate repetition or invalid JSON — worth one retry). */
async function requestVerdictOnce(
  market: GammaMarket,
  marketUrl: string | null
): Promise<AiVerdict> {
  const outcomes = effectiveOutcomes(market);
  let response;
  try {
    response = await client.messages.create({
      model: "claude-haiku-4-5",
      // Was 4096 — too tight for the previous model with high-effort
      // json_schema output on this schema (explanation + 3-5 factors + 2-4
      // risks + whatCouldChange): a response that runs long can hit the cap
      // mid-string, which is indistinguishable from a truncated/malformed
      // response by the time it reaches JSON.parse. 8192 gives real headroom
      // without materially changing latency/cost for the common case.
      max_tokens: 8192,
      // No `thinking` field: Haiku 4.5 runs with no extended thinking when
      // the field is omitted (thinking is opt-in on this model tier, not
      // on-by-default like the Opus-tier models this used to run on) — this
      // is also the single biggest cost driver being removed by this
      // switch. No `effort` either: output_config.effort errors on Haiku
      // 4.5 (it's an Opus-tier-and-newer control), so the json_schema
      // format is the only output_config field left here.
      output_config: {
        format: {
          type: "json_schema",
          schema: buildVerdictSchema(outcomes),
        },
      },
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: buildUserPrompt(market, marketUrl, outcomes) },
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

  // Catches a degenerate/looping generation (e.g. a field repeating the
  // same character hundreds of times) before it reaches JSON.parse, where
  // it would otherwise fail as an opaque "Unterminated string" once the
  // runaway text pushes the response past max_tokens mid-field.
  if (hasDegenerateRepetition(textBlock.text)) {
    console.error(
      "[anthropic:analyzeMarket] répétition dégénérée détectée dans la réponse:",
      truncateForLog(textBlock.text)
    );
    throw new MalformedVerdictError("Réponse de l'IA dégénérée (répétition anormale détectée).");
  }

  try {
    return JSON.parse(textBlock.text) as AiVerdict;
  } catch (error) {
    console.error(
      "[anthropic:analyzeMarket] JSON invalide dans la réponse:",
      truncateForLog(textBlock.text),
      error
    );
    throw new MalformedVerdictError("Réponse de l'IA mal formée (JSON invalide).");
  }
}

/** Shared by scan-markets and analyze-market (Analyse IA à la demande) —
 * both call this same function, so the retry/repetition protection below
 * covers both without duplicating anything.
 *
 * A malformed response (degenerate repetition or bad JSON) gets exactly
 * one retry before giving up, since this class of failure is a one-off
 * generation anomaly, not a persistent problem with the request — a
 * second attempt is very likely to come back clean. A failed/refused call
 * is not retried here (unlikely to succeed differently on request retry;
 * scan-markets already treats a failed candidate as skippable). */
export async function analyzeMarket(
  market: GammaMarket,
  marketUrl: string | null
): Promise<AiVerdict> {
  try {
    return await requestVerdictOnce(market, marketUrl);
  } catch (error) {
    if (!(error instanceof MalformedVerdictError)) throw error;

    console.warn(
      `[anthropic:analyzeMarket] réponse inexploitable (${error.message}) — nouvelle tentative`
    );
    try {
      return await requestVerdictOnce(market, marketUrl);
    } catch (retryError) {
      if (retryError instanceof MalformedVerdictError) {
        throw new AiServiceError(retryError.message);
      }
      throw retryError;
    }
  }
}

/** Cropped screenshots, multi-market event pages, and busy Polymarket chrome
 * (nav bar, price ticker, chart, other cards in a feed) make this a real
 * OCR-and-disambiguation task, not a trivial read — the prompt spells out
 * verbatim-copy and multi-market disambiguation rules explicitly (rather
 * than relying on thinking to work it out) precisely because this now runs
 * on Haiku 4.5, which doesn't support output_config.effort or extended
 * thinking the way the Opus-tier model this used to run on did. */
const IMAGE_EXTRACTION_PROMPT = `Cette image est une capture d'écran de l'application ou du site Polymarket.

Ta tâche : identifier la question du marché de prédiction affichée, et la recopier EXACTEMENT telle qu'elle apparaît à l'écran.

Où chercher : la question d'un marché Polymarket est le texte principal en gros caractères (souvent en gras), généralement accompagné d'un prix ou d'un pourcentage juste à côté ou en dessous. Ignore tout le reste : barre de navigation, boutons "Trade"/"Buy Yes"/"Buy No", graphique de prix, volume, montants en dollars isolés, commentaires, autres marchés listés plus bas ou sur les côtés.

Si l'image montre PLUSIEURS questions de marché (un flux de plusieurs cartes, ou un événement à choix multiples avec plusieurs lignes de sous-marchés) : choisis celle qui est clairement la question principale/mise en avant — la plus grande, centrée, ou celle associée à la vue détaillée ouverte. Si aucune n'est clairement mise en avant (ex: simple liste de plusieurs marchés similaires sans marché "ouvert"), réponds INTROUVABLE plutôt que de deviner.

Règles de recopie :
- Recopie le texte MOT POUR MOT, caractère pour caractère, exactement comme affiché.
- Ne paraphrase JAMAIS, ne traduis JAMAIS, ne résume JAMAIS, ne corrige JAMAIS une formulation qui te semblerait étrange.
- Conserve la ponctuation, la casse, les chiffres et les unités exactement tels qu'affichés (garde le "?" final s'il est présent).
- Ne recopie AUCUN autre texte (prix, dates d'échéance, volume, boutons) — uniquement la question elle-même.

Réponds UNIQUEMENT avec cette question, sans phrase d'introduction ni commentaire. Si aucune question de marché n'est lisible avec certitude, réponds exactement: INTROUVABLE`;

/** Reads the market question directly from a screenshot using vision, so we
 * can then look the market up on the Gamma API for real numeric data. */
export async function extractMarketQuestionFromImage(
  imageBase64: string,
  mediaType: string
): Promise<string | null> {
  let response;
  try {
    response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
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
              text: IMAGE_EXTRACTION_PROMPT,
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
  if (response.stop_reason === "refusal") {
    console.warn("[anthropic:extractMarketQuestionFromImage] refus de contenu sur l'image fournie");
    return null;
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    console.warn(
      "[anthropic:extractMarketQuestionFromImage] réponse sans bloc texte exploitable"
    );
    return null;
  }

  const text = textBlock.text.trim();
  if (!text || text === "INTROUVABLE") {
    console.warn(
      `[anthropic:extractMarketQuestionFromImage] question jugée illisible par le modèle (réponse brute: "${text}")`
    );
    return null;
  }
  console.log(`[anthropic:extractMarketQuestionFromImage] question extraite: "${text}"`);
  return text;
}
