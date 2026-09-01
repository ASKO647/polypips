import Anthropic from "npm:@anthropic-ai/sdk@0.116.0";
import { AiServiceError } from "../analyze-market/anthropic-analysis.ts";

/**
 * The Sport universe's "Analyse IA", step 2: the user has already picked
 * one real, dated head-to-head fixture (from sport-match-search's next-3
 * list) — this predicts its outcome and 2-3 relevant secondary markets on
 * the SAME match (confirmed with the user: same-match variants like
 * over/under buts or BTTS for football, not other fixtures). Deliberately
 * its own module rather than a generalization of analyze-market's or the
 * old analyze-sports-bet's: there's no bookmaker odds here at all (this
 * predicts a match, it doesn't evaluate a specific wager), and — unlike
 * analyze-market's Yes/No/candidate-name schema — "decision" here is
 * always one of exactly the two real team names, plus "Match nul" for
 * football (basketball has no draw).
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
      `[anthropic-sport-match:${context}] status=${error.status} name=${error.name} message=${error.message}`
    );
    return;
  }
  if (error instanceof Error) {
    console.error(`[anthropic-sport-match:${context}] ${error.name}: ${error.message}`);
    return;
  }
  console.error(`[anthropic-sport-match:${context}] erreur non typée:`, error);
}

export type RecentMeeting = {
  kickoffAt: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  competitionName: string | null;
};

export type SportMatchInput = {
  sport: "football" | "basketball";
  homeTeamName: string;
  awayTeamName: string;
  competitionName: string | null;
  kickoffAt: string;
  recentMeetings: RecentMeeting[];
};

export type SecondaryMarket = {
  market: string;
  suggestion: string;
  rationale: string;
};

export type SportMatchVerdict = {
  predictedWinner: string;
  aiProbability: number;
  confidence: "Faible" | "Moyenne" | "Élevée";
  explanation: string;
  favorableFactors: string[];
  risks: string[];
  whatCouldChange: string;
  secondaryMarkets: SecondaryMarket[];
};

function outcomeLabels(input: SportMatchInput): string[] {
  return input.sport === "football"
    ? [input.homeTeamName, input.awayTeamName, "Match nul"]
    : [input.homeTeamName, input.awayTeamName];
}

function buildSchema(outcomes: string[]) {
  return {
    type: "object",
    properties: {
      predictedWinner: {
        type: "string",
        enum: outcomes,
        description: `L'issue que tu juges la plus probable, EXACTEMENT l'un de ces libellés : ${outcomes
          .map((o) => `"${o}"`)
          .join(", ")}.`,
      },
      aiProbability: {
        type: "integer",
        description: "Ta probabilité estimée (0-100) que cette issue précise (predictedWinner) se réalise.",
      },
      confidence: { type: "string", enum: ["Faible", "Moyenne", "Élevée"] },
      explanation: {
        type: "string",
        description:
          "Explication détaillée (3-5 phrases) citant la forme récente connue des deux équipes, l'historique de leurs confrontations, et le contexte du match (enjeu, compétition).",
      },
      favorableFactors: {
        type: "array",
        items: { type: "string" },
        description: "3 à 5 facteurs concrets qui soutiennent ce pronostic.",
      },
      risks: {
        type: "array",
        items: { type: "string" },
        description: "2 à 4 risques concrets qui pourraient invalider ce pronostic.",
      },
      whatCouldChange: {
        type: "string",
        description: "Un événement concret et plausible (blessure, suspension, enjeu) qui changerait significativement ce pronostic.",
      },
      secondaryMarkets: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        description:
          "2 à 3 marchés secondaires pertinents sur CE MÊME match (pas d'autres rencontres) — par exemple, pour le football : total de buts (plus/moins de X), les deux équipes marquent (oui/non), score exact probable ; pour le basketball : total de points, écart de victoire (handicap), plus haut marqueur probable.",
        items: {
          type: "object",
          properties: {
            market: { type: "string", description: "Le nom du marché, ex: \"Plus/moins de 2.5 buts\"." },
            suggestion: { type: "string", description: "La sélection suggérée sur ce marché, ex: \"Plus de 2.5 buts\"." },
            rationale: { type: "string", description: "Une phrase justifiant cette suggestion." },
          },
          required: ["market", "suggestion", "rationale"],
          additionalProperties: false,
        },
      },
    },
    required: [
      "predictedWinner",
      "aiProbability",
      "confidence",
      "explanation",
      "favorableFactors",
      "risks",
      "whatCouldChange",
      "secondaryMarkets",
    ],
    additionalProperties: false,
  } as const;
}

const SYSTEM_PROMPT = `Tu es l'analyste IA sportif de Polypips, un outil d'aide à la décision pour l'analyse de rencontres sportives réelles (football et basketball pour l'instant).

Règles impératives, sans exception :
- Ne présente JAMAIS ton pronostic comme une certitude. C'est une estimation probabiliste, pas une garantie.
- Reste toujours au conditionnel/probabiliste dans ton raisonnement ("pourrait", "semble", "estimation") — jamais "va gagner" ou toute formulation affirmative sur un résultat futur.
- Base ton analyse sur des éléments concrets : l'historique réel des confrontations fourni, la forme récente connue des deux équipes, le contexte de la compétition, et toute connaissance factuelle pertinente que tu possèdes.
- "predictedWinner" doit être EXACTEMENT l'un des libellés fournis dans le message utilisateur.
- "aiProbability" doit être ton estimation réelle et indépendante de la probabilité de l'issue choisie.
- Les marchés secondaires doivent porter sur CE match précis, jamais sur d'autres rencontres.
- Si l'information disponible est insuffisante pour trancher avec confiance (peu ou pas d'historique de confrontations, équipes peu connues), dis-le explicitement dans "explanation" et choisis un niveau de confiance "Faible" plutôt que d'inventer des statistiques.`;

function formatMeeting(m: RecentMeeting): string {
  const score = m.homeScore !== null && m.awayScore !== null ? `${m.homeScore}-${m.awayScore}` : "score inconnu";
  const date = new Date(m.kickoffAt).toLocaleDateString("fr-FR");
  const competition = m.competitionName ? ` (${m.competitionName})` : "";
  return `- ${date} : ${m.homeTeamName} ${score} ${m.awayTeamName}${competition}`;
}

function buildUserPrompt(input: SportMatchInput): string {
  const meetingsBlock =
    input.recentMeetings.length > 0
      ? input.recentMeetings.map(formatMeeting).join("\n")
      : "Aucune confrontation directe récente enregistrée entre ces deux équipes.";

  return `Analyse cette rencontre ${input.sport === "football" ? "de football" : "de basketball"} réelle et à venir :

MATCH : ${input.homeTeamName} vs ${input.awayTeamName}
COMPÉTITION : ${input.competitionName ?? "non précisée"}
DATE : ${new Date(input.kickoffAt).toLocaleString("fr-FR")}

HISTORIQUE DES CONFRONTATIONS DIRECTES (plus récentes en premier) :
${meetingsBlock}

Produis ton pronostic structuré sur cette rencontre, ainsi que 2 à 3 marchés secondaires pertinents pour ce même match.`;
}

async function requestVerdictOnce(input: SportMatchInput): Promise<SportMatchVerdict> {
  const outcomes = outcomeLabels(input);
  let response;
  try {
    response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 8192,
      output_config: {
        format: { type: "json_schema", schema: buildSchema(outcomes) },
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });
  } catch (error) {
    logAnthropicError("analyzeSportMatch", error);
    throw new AiServiceError("Échec de l'appel à l'API Anthropic pour le pronostic.");
  }

  if (response.stop_reason === "refusal") {
    console.error(
      `[anthropic-sport-match:analyzeSportMatch] refus de contenu — category=${response.stop_details?.category ?? "inconnue"}`
    );
    throw new AiServiceError("L'IA a refusé d'analyser ce match (contenu potentiellement sensible).");
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    console.error("[anthropic-sport-match:analyzeSportMatch] réponse sans bloc texte exploitable", response);
    throw new AiServiceError("Réponse de l'IA vide ou inattendue.");
  }

  if (hasDegenerateRepetition(textBlock.text)) {
    console.error(
      "[anthropic-sport-match:analyzeSportMatch] répétition dégénérée détectée dans la réponse:",
      truncateForLog(textBlock.text)
    );
    throw new MalformedVerdictError("Réponse de l'IA dégénérée (répétition anormale détectée).");
  }

  try {
    return JSON.parse(textBlock.text) as SportMatchVerdict;
  } catch (error) {
    console.error(
      "[anthropic-sport-match:analyzeSportMatch] JSON invalide dans la réponse:",
      truncateForLog(textBlock.text),
      error
    );
    throw new MalformedVerdictError("Réponse de l'IA mal formée (JSON invalide).");
  }
}

/** Same one-retry-on-malformed-response policy as analyze-market's own
 * analyzeMarket — see that function's comment for why. */
export async function analyzeSportMatch(input: SportMatchInput): Promise<SportMatchVerdict> {
  try {
    return await requestVerdictOnce(input);
  } catch (error) {
    if (!(error instanceof MalformedVerdictError)) throw error;
    console.warn(
      `[anthropic-sport-match:analyzeSportMatch] réponse inexploitable (${error.message}) — nouvelle tentative`
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
