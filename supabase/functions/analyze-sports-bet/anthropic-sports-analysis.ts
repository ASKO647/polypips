import Anthropic from "npm:@anthropic-ai/sdk@0.116.0";
import { AiServiceError } from "../analyze-market/anthropic-analysis.ts";

/**
 * Generic sports-bet analyst — the Sport-universe counterpart to
 * analyze-market/anthropic-analysis.ts, but deliberately its own module
 * rather than a generalization of it: there is no Gamma market here, no
 * YES/NO-style outcome pair, no automatic resolution. The user names ONE
 * specific selection at ONE bookmaker's odds (any sport, any bookmaker,
 * anywhere in the world — never limited to whatever sync-sports-data
 * happens to have synced from API-Sports), and the model evaluates that
 * one bet: its own probability estimate for the selection vs. the
 * probability the bookmaker's odds imply, converted from whatever odds
 * format the user/screenshot gives (decimal, American, fractional — the
 * model handles the conversion, not a hand-rolled parser here, since
 * getting that format-detection subtly wrong in code would silently
 * corrupt every edge calculation).
 *
 * AiServiceError is reused from analyze-market rather than redefined — a
 * plain error-type marker with no Polymarket-specific meaning, safe to
 * share.
 */

const client = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
});

class MalformedVerdictError extends Error {}

const DEGENERATE_REPETITION_PATTERN = /(.{1,12})\1{19,}/;
function hasDegenerateRepetition(text: string): boolean {
  return DEGENERATE_REPETITION_PATTERN.test(text);
}

function truncateForLog(text: string, maxLength = 800): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}… [${text.length - maxLength} caractères tronqués]`;
}

function logAnthropicError(context: string, error: unknown): void {
  if (error instanceof Anthropic.APIError) {
    console.error(
      `[anthropic-sports:${context}] status=${error.status} name=${error.name} message=${error.message}`
    );
    return;
  }
  if (error instanceof Error) {
    console.error(`[anthropic-sports:${context}] ${error.name}: ${error.message}`);
    return;
  }
  console.error(`[anthropic-sports:${context}] erreur non typée:`, error);
}

export type SportsBetInput = {
  sport: string;
  participants: string;
  betType: string;
  /** The specific outcome the given odds apply to — e.g. "PSG", "Plus de
   * 2.5 buts", "Alcaraz en 3 sets". */
  selection: string;
  /** Verbatim, whatever format the user typed or the screenshot showed
   * (e.g. "1.85", "-110", "5/4") — never reformatted before reaching the
   * model. */
  bookmakerOdds: string;
};

export type SportsBetVerdict = {
  aiProbability: number;
  bookmakerImpliedProbability: number;
  confidence: "Faible" | "Moyenne" | "Élevée";
  explanation: string;
  favorableFactors: string[];
  risks: string[];
  whatCouldChange: string;
};

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    aiProbability: {
      type: "integer",
      description:
        "Ta propre estimation indépendante (0-100) de la probabilité que la sélection décrite se réalise.",
    },
    bookmakerImpliedProbability: {
      type: "integer",
      description:
        "Probabilité implicite (0-100) de la cote du bookmaker fournie, quel que soit son format (décimale, américaine, fractionnaire) — convertis-la toi-même.",
    },
    confidence: { type: "string", enum: ["Faible", "Moyenne", "Élevée"] },
    explanation: {
      type: "string",
      description:
        "Explication détaillée (3-5 phrases) citant la forme des équipes/participants, le contexte et les statistiques pertinentes que tu connais ou peux déduire.",
    },
    favorableFactors: {
      type: "array",
      items: { type: "string" },
      description: "3 à 5 facteurs concrets qui soutiennent cette sélection.",
    },
    risks: {
      type: "array",
      items: { type: "string" },
      description: "2 à 4 risques concrets qui pourraient invalider l'analyse.",
    },
    whatCouldChange: {
      type: "string",
      description: "Un événement concret et plausible qui changerait significativement cette analyse.",
    },
  },
  required: [
    "aiProbability",
    "bookmakerImpliedProbability",
    "confidence",
    "explanation",
    "favorableFactors",
    "risks",
    "whatCouldChange",
  ],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `Tu es l'analyste IA sportif de Polypips, un outil d'aide à la décision pour des paris sportifs — n'importe quel sport, n'importe quel bookmaker dans le monde.

Règles impératives, sans exception :
- Ne présente JAMAIS ton analyse comme une garantie de gain. C'est une estimation probabiliste, pas une certitude.
- Reste toujours au conditionnel/probabiliste dans ton raisonnement ("pourrait", "semble", "estimation") — jamais "va gagner", "est sûr de", ou toute formulation affirmative sur un résultat futur.
- Ne recommande JAMAIS de miser une somme précise ni n'encourage à parier plus que ce que l'utilisateur envisage déjà.
- Base ton analyse sur des éléments concrets : la forme récente connue des équipes/participants, le contexte du match/événement (enjeu, blessures connues, historique), et toute connaissance factuelle pertinente que tu possèdes sur ce sport/cette compétition.
- "aiProbability" doit être ton estimation réelle et indépendante — jamais une simple copie de la probabilité implicite du bookmaker.
- "bookmakerImpliedProbability" doit être calculée correctement à partir de la cote fournie, quel que soit son format.
- Si l'information disponible est insuffisante pour trancher avec confiance (sport ou participants peu connus, contexte flou), dis-le explicitement dans "explanation" et choisis un niveau de confiance "Faible" plutôt que d'inventer des statistiques.`;

function buildUserPrompt(input: SportsBetInput): string {
  return `Analyse ce pari sportif réel :

SPORT : ${input.sport}
MATCH / PARTICIPANTS : ${input.participants}
TYPE DE PARI : ${input.betType}
SÉLECTION ANALYSÉE : ${input.selection}
COTE PROPOSÉE PAR LE BOOKMAKER : ${input.bookmakerOdds}

Produis ton verdict structuré sur cette sélection précise, à cette cote précise.`;
}

async function requestVerdictOnce(input: SportsBetInput): Promise<SportsBetVerdict> {
  let response;
  try {
    response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 8192,
      output_config: {
        format: { type: "json_schema", schema: VERDICT_SCHEMA },
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });
  } catch (error) {
    logAnthropicError("analyzeSportsBet", error);
    throw new AiServiceError("Échec de l'appel à l'API Anthropic pour le verdict d'analyse.");
  }

  if (response.stop_reason === "refusal") {
    console.error(
      `[anthropic-sports:analyzeSportsBet] refus de contenu — category=${response.stop_details?.category ?? "inconnue"}`
    );
    throw new AiServiceError("L'IA a refusé d'analyser ce pari (contenu potentiellement sensible).");
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    console.error("[anthropic-sports:analyzeSportsBet] réponse sans bloc texte exploitable", response);
    throw new AiServiceError("Réponse de l'IA vide ou inattendue.");
  }

  if (hasDegenerateRepetition(textBlock.text)) {
    console.error(
      "[anthropic-sports:analyzeSportsBet] répétition dégénérée détectée dans la réponse:",
      truncateForLog(textBlock.text)
    );
    throw new MalformedVerdictError("Réponse de l'IA dégénérée (répétition anormale détectée).");
  }

  try {
    return JSON.parse(textBlock.text) as SportsBetVerdict;
  } catch (error) {
    console.error(
      "[anthropic-sports:analyzeSportsBet] JSON invalide dans la réponse:",
      truncateForLog(textBlock.text),
      error
    );
    throw new MalformedVerdictError("Réponse de l'IA mal formée (JSON invalide).");
  }
}

/** Same one-retry-on-malformed-response policy as analyze-market's own
 * analyzeMarket — see that function's comment for why. */
export async function analyzeSportsBet(input: SportsBetInput): Promise<SportsBetVerdict> {
  try {
    return await requestVerdictOnce(input);
  } catch (error) {
    if (!(error instanceof MalformedVerdictError)) throw error;
    console.warn(
      `[anthropic-sports:analyzeSportsBet] réponse inexploitable (${error.message}) — nouvelle tentative`
    );
    try {
      return await requestVerdictOnce(input);
    } catch (retryError) {
      if (retryError instanceof MalformedVerdictError) {
        throw new AiServiceError(retryError.message);
      }
      throw retryError;
    }
  }
}

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    readable: {
      type: "boolean",
      description:
        "true si tu identifies clairement un pari sportif dans l'image (participants, type de pari, cote) ; false sinon.",
    },
    sport: { type: "string", description: "Le sport concerné, ou chaîne vide si non lisible." },
    participants: {
      type: "string",
      description: "Les équipes ou participants exacts tels qu'affichés, ou chaîne vide si non lisible.",
    },
    betType: {
      type: "string",
      description: "Le type de pari affiché (ex: 'Vainqueur du match', 'Total de buts'), ou chaîne vide.",
    },
    selection: {
      type: "string",
      description: "La sélection précise à laquelle la cote s'applique, ou chaîne vide.",
    },
    bookmakerOdds: {
      type: "string",
      description: "La cote exacte telle qu'affichée (recopiée verbatim), ou chaîne vide.",
    },
  },
  required: ["readable", "sport", "participants", "betType", "selection", "bookmakerOdds"],
  additionalProperties: false,
} as const;

const EXTRACTION_PROMPT = `Cette image est une capture d'écran d'un site ou d'une application de paris sportifs (n'importe quel bookmaker dans le monde — Bet365, Betclic, DraftKings, Winamax, etc.).

Ta tâche : identifier un pari sportif précis affiché dans cette image — le sport, les équipes/participants, le type de pari, la sélection exacte, et la cote proposée pour cette sélection.

Recopie les textes MOT POUR MOT tels qu'affichés (noms d'équipes, libellés de pari, cote). Ne traduis pas, ne reformule pas.

Si l'image montre plusieurs paris ou plusieurs cotes, choisis celui qui est le plus clairement mis en avant (le plus grand, sélectionné, ou dans un "coupon" de pari ouvert). Si aucun pari sportif n'est identifiable avec certitude (image floue, sans rapport, ou plusieurs paris ambigus sans un clairement principal), réponds avec readable=false et laisse les autres champs vides.`;

export async function extractBetFromImage(
  imageBase64: string,
  mediaType: string
): Promise<SportsBetInput | null> {
  let response;
  try {
    response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      output_config: {
        format: { type: "json_schema", schema: EXTRACTION_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: imageBase64,
              },
            },
            { type: "text", text: EXTRACTION_PROMPT },
          ],
        },
      ],
    });
  } catch (error) {
    logAnthropicError("extractBetFromImage", error);
    throw new AiServiceError("Échec de l'appel à l'API Anthropic pour la lecture de l'image.");
  }

  if (response.stop_reason === "refusal") {
    console.warn("[anthropic-sports:extractBetFromImage] refus de contenu sur l'image fournie");
    return null;
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    console.warn("[anthropic-sports:extractBetFromImage] réponse sans bloc texte exploitable");
    return null;
  }

  let parsed: SportsBetInput & { readable: boolean };
  try {
    parsed = JSON.parse(textBlock.text);
  } catch (error) {
    console.warn("[anthropic-sports:extractBetFromImage] JSON invalide dans la réponse", error);
    return null;
  }

  if (
    !parsed.readable ||
    !parsed.sport ||
    !parsed.participants ||
    !parsed.betType ||
    !parsed.selection ||
    !parsed.bookmakerOdds
  ) {
    console.warn("[anthropic-sports:extractBetFromImage] pari jugé illisible par le modèle");
    return null;
  }

  return {
    sport: parsed.sport,
    participants: parsed.participants,
    betType: parsed.betType,
    selection: parsed.selection,
    bookmakerOdds: parsed.bookmakerOdds,
  };
}
