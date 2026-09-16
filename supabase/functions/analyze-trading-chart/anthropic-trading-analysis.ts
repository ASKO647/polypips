import Anthropic from "npm:@anthropic-ai/sdk@0.116.0";
import { AiServiceError } from "../analyze-market/anthropic-analysis.ts";
import type { Candle } from "../_shared/binance.ts";

/**
 * The Trading universe's "Analyse IA": the user drops a screenshot of a
 * trading chart (TradingView, MT5, any other platform — the model reads
 * whatever visual style it's given, no platform-specific parsing) and
 * gets back a structured read. Combines two patterns that already exist
 * separately elsewhere in this codebase rather than inventing a third:
 * the vision content-block shape from analyze-market's own
 * extractMarketQuestionFromImage (image + text in one user message), and
 * the JSON-schema structured-output shape from analyze-sport-match's
 * analyzeSportMatch (one Anthropic call, one retry on a malformed
 * response).
 *
 * High-risk-domain framing is stricter here than anywhere else in the
 * app: leveraged trading is real, immediate financial risk, so beyond the
 * usual "never a certainty" rule, the schema itself has no field for a
 * money amount or position/lot size at all — TP/SL are always a price
 * level or a percentage, enforced by what's even askable in the schema,
 * not just by a prompt instruction the model could ignore.
 */

const client = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
});

/** Same depth toggle as analyze-market — see that file's AnalysisDepth
 * comment for the model/config rationale. Only the screenshot flow
 * (analyzeTradingChart) exposes this; the candles flow
 * (analyzeTradingCandles) backs the automated "Sélection du jour" cron,
 * which has no per-request user choice to be deep or standard. */
export type AnalysisDepth = "standard" | "deep";

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
      `[anthropic-trading:${context}] status=${error.status} name=${error.name} message=${error.message}`
    );
    return;
  }
  if (error instanceof Error) {
    console.error(`[anthropic-trading:${context}] ${error.name}: ${error.message}`);
    return;
  }
  console.error(`[anthropic-trading:${context}] erreur non typée:`, error);
}

export type KeyLevel = {
  type: "support" | "resistance";
  level: string;
};

export type TradingChartVerdict = {
  instrument: string | null;
  timeframe: string | null;
  recommendation: "Acheter" | "Vendre" | "Attendre";
  confidence: "Faible" | "Moyenne" | "Élevée";
  trendAnalysis: string;
  keyLevels: KeyLevel[];
  indicatorsObserved: string[];
  /** A price level ("1.0950") or a percentage from entry ("+2.5%") —
   * NEVER a money amount or a lot/position size. Null when
   * recommendation is "Attendre" and no concrete level is warranted yet. */
  takeProfit: string | null;
  stopLoss: string | null;
  explanation: string;
  risks: string[];
};

function buildSchema(depth: AnalysisDepth = "standard") {
  const deep = depth === "deep";
  return {
  type: "object",
  properties: {
    instrument: {
      type: ["string", "null"],
      description:
        "L'instrument identifié sur le graphique (ex: \"EUR/USD\", \"BTC/USD\", \"AAPL\"), ou null si tu ne peux pas l'identifier avec confiance à partir de l'image.",
    },
    timeframe: {
      type: ["string", "null"],
      description: "L'unité de temps du graphique si elle est visible (ex: \"H1\", \"4H\", \"Daily\"), ou null.",
    },
    recommendation: {
      type: "string",
      enum: ["Acheter", "Vendre", "Attendre"],
      description: "Ta recommandation — jamais une garantie, une lecture probabiliste du graphique fourni.",
    },
    confidence: { type: "string", enum: ["Faible", "Moyenne", "Élevée"] },
    trendAnalysis: {
      type: "string",
      description: "2-3 phrases décrivant la tendance identifiée sur le graphique (haussière, baissière, range...).",
    },
    keyLevels: {
      type: "array",
      maxItems: 4,
      description: "Niveaux de support/résistance visibles sur le graphique.",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["support", "resistance"] },
          level: { type: "string", description: "Le niveau de prix, ex: \"1.0920\"." },
        },
        required: ["type", "level"],
        additionalProperties: false,
      },
    },
    indicatorsObserved: {
      type: "array",
      items: { type: "string" },
      description: "Indicateurs techniques visibles sur le graphique (moyennes mobiles, RSI, MACD...) — tableau vide si aucun n'est visible, jamais inventés.",
    },
    takeProfit: {
      type: ["string", "null"],
      description:
        "Niveau de Take Profit proposé — UNIQUEMENT un niveau de prix (ex: \"1.0980\") ou un pourcentage depuis l'entrée (ex: \"+2.5%\"). JAMAIS un montant en devise ni une taille de position. Null si \"Attendre\" et rien de concret à proposer.",
    },
    stopLoss: {
      type: ["string", "null"],
      description:
        "Niveau de Stop Loss proposé — même contrainte que takeProfit : uniquement un niveau de prix ou un pourcentage, jamais un montant ni une taille de position.",
    },
    explanation: {
      type: "string",
      description: deep
        ? "Explication détaillée et nuancée (8-12 phrases) du raisonnement, croisant tendance, niveaux, indicateurs et plusieurs scénarios possibles, au conditionnel, jamais affirmatif sur un résultat futur."
        : "Explication détaillée (3-5 phrases) du raisonnement — tendance, niveaux, indicateurs — au conditionnel, jamais affirmatif sur un résultat futur.",
    },
    risks: {
      type: "array",
      items: { type: "string" },
      description: deep
        ? "4-6 risques concrets qui pourraient invalider cette lecture, aussi précis et variés que possible."
        : "2-4 risques concrets qui pourraient invalider cette lecture.",
    },
  },
  required: [
    "instrument",
    "timeframe",
    "recommendation",
    "confidence",
    "trendAnalysis",
    "keyLevels",
    "indicatorsObserved",
    "takeProfit",
    "stopLoss",
    "explanation",
    "risks",
  ],
  additionalProperties: false,
  } as const;
}

const SYSTEM_PROMPT = `Tu es l'analyste IA trading de Polypips, un outil d'aide à la décision pour la lecture de graphiques de trading (Forex, crypto, actions, indices) fournis en capture d'écran, quelle que soit la plateforme d'origine (TradingView, MT5, ou autre).

Règles impératives, sans exception — le trading avec effet de levier est un domaine à haut risque de perte en capital :
- Ne présente JAMAIS ta lecture comme une garantie de gain. C'est une estimation probabiliste basée uniquement sur l'image fournie.
- Reste toujours au conditionnel/probabiliste ("pourrait", "semble indiquer", "suggère") — jamais "va monter", "va baisser" ou toute formulation affirmative sur un résultat futur.
- "takeProfit" et "stopLoss" doivent être EXCLUSIVEMENT un niveau de prix ou un pourcentage depuis l'entrée. Ne suggère JAMAIS un montant en devise, une taille de position, un nombre de lots, ou tout autre engagement financier précis — ce n'est pas ton rôle et ce serait dangereux.
- Base ton analyse uniquement sur ce qui est visible dans l'image : tendance, niveaux de support/résistance, indicateurs techniques affichés. N'invente jamais un indicateur ou un niveau qui n'apparaît pas sur le graphique.
- Si l'image est trop floue, trop petite, ou ne contient pas assez d'information pour une lecture fiable, dis-le explicitement dans "explanation", recommande "Attendre", et choisis un niveau de confiance "Faible" plutôt que d'inventer une analyse.
- Si l'instrument ou l'unité de temps ne sont pas clairement identifiables, retourne null plutôt que de deviner.`;

/** Appended only for depth "deep" (screenshot flow only) — same rules,
 * more thoroughness. */
const DEEP_SYSTEM_PROMPT_ADDENDUM = `

MODE ANALYSE APPROFONDIE : tu disposes ici d'un budget de raisonnement étendu — utilise-le pour croiser davantage de facteurs visibles sur le graphique (structure de tendance, multiples niveaux, cohérence des indicateurs affichés) avant de conclure. Développe une explication nuancée et un nombre de risques plus riche que pour une lecture standard, tout en respectant strictement les mêmes règles ci-dessus.`;

const USER_PROMPT =
  "Analyse ce graphique de trading (capture d'écran fournie). Identifie la tendance, les niveaux de support/résistance visibles, les indicateurs techniques affichés, et produis une recommandation structurée avec des niveaux de Take Profit / Stop Loss (en prix ou en pourcentage uniquement, jamais un montant).";

/**
 * Second entry point into the same schema/model/retry pipeline as
 * analyzeTradingChart, for the Trading universe's automated "Sélection du
 * jour" (scan-trading-pairs): real OHLC candles fetched live from Binance
 * (_shared/binance.ts) rather than a user-uploaded screenshot, so there is
 * no image to read at all. Deliberately its own system prompt rather than
 * reusing SYSTEM_PROMPT as-is — every "visible dans l'image" / "graphique"
 * framing would be actively misleading here, where the model never sees a
 * chart image, only a table of numbers. The output schema, risk rules
 * (never a certainty, never a money amount for TP/SL), and one-retry
 * malformed-JSON policy are identical to the screenshot flow on purpose:
 * one shared shape means one shared frontend renderer
 * (TradingAnalysisResult) and one shared table column set, regardless of
 * which flow produced the row.
 */
const SYSTEM_PROMPT_CANDLES = `Tu es l'analyste IA trading de Polypips, un outil d'aide à la décision pour la lecture de graphiques de trading (Forex, crypto, actions, indices).

Ici, tu ne reçois pas une image de graphique : tu reçois directement les données de prix réelles (chandelles OHLC — ouverture/haut/bas/clôture/volume) d'une paire crypto, récupérées en direct depuis Binance. Raisonne exactement comme si tu lisais un graphique construit à partir de ces mêmes chandelles.

Règles impératives, sans exception — le trading avec effet de levier est un domaine à haut risque de perte en capital :
- Ne présente JAMAIS ta lecture comme une garantie de gain. C'est une estimation probabiliste basée uniquement sur les données fournies.
- Reste toujours au conditionnel/probabiliste ("pourrait", "semble indiquer", "suggère") — jamais "va monter", "va baisser" ou toute formulation affirmative sur un résultat futur.
- "takeProfit" et "stopLoss" doivent être EXCLUSIVEMENT un niveau de prix ou un pourcentage depuis l'entrée. Ne suggère JAMAIS un montant en devise, une taille de position, un nombre de lots, ou tout autre engagement financier précis — ce n'est pas ton rôle et ce serait dangereux.
- Base ton analyse uniquement sur les chandelles OHLC fournies : tendance (déduite de la suite des clôtures), niveaux de support/résistance (déduits des plus hauts/plus bas récents), et volume. Aucun indicateur technique (RSI, MACD, moyennes mobiles...) n'est pré-calculé dans les données fournies — si "indicatorsObserved" ne peut pas être déduit avec certitude à partir des seules chandelles, laisse ce tableau vide plutôt que d'inventer une valeur d'indicateur que tu n'as pas réellement calculée.
- Si les données fournies sont insuffisantes pour une lecture fiable (trop peu de chandelles, mouvements incohérents), dis-le explicitement dans "explanation", recommande "Attendre", et choisis un niveau de confiance "Faible" plutôt que d'inventer une analyse.
- L'instrument et l'unité de temps te sont toujours donnés explicitement dans le message — reporte-les tels quels, ne les devine jamais.`;

function formatCandle(c: Candle): string {
  return `${c.openTime} — O:${c.open} H:${c.high} L:${c.low} C:${c.close} V:${c.volume}`;
}

export type CandleAnalysisInput = {
  displaySymbol: string;
  timeframe: string;
  candles: Candle[];
};

function buildCandlesUserPrompt(input: CandleAnalysisInput): string {
  const candlesBlock = input.candles.map(formatCandle).join("\n");
  return `Instrument : ${input.displaySymbol}
Unité de temps : ${input.timeframe} (une chandelle par ligne, la plus ancienne en premier)

CHANDELLES OHLC RÉCENTES :
${candlesBlock}

Analyse la tendance, les niveaux de support/résistance déductibles de ces chandelles, et produis une recommandation structurée avec des niveaux de Take Profit / Stop Loss (en prix ou en pourcentage uniquement, jamais un montant).`;
}

type VerdictContent =
  | { kind: "image"; imageBase64: string; mediaType: string; depth?: AnalysisDepth }
  | { kind: "candles"; input: CandleAnalysisInput };

async function requestVerdictOnce(content: VerdictContent): Promise<TradingChartVerdict> {
  // Depth only ever applies to the screenshot flow — the candles flow
  // (automated "Sélection du jour") has no per-request user choice.
  const deep = content.kind === "image" && content.depth === "deep";
  const [system, messageContent] =
    content.kind === "image"
      ? [
          deep ? `${SYSTEM_PROMPT}${DEEP_SYSTEM_PROMPT_ADDENDUM}` : SYSTEM_PROMPT,
          [
            {
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: content.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: content.imageBase64,
              },
            },
            { type: "text" as const, text: USER_PROMPT },
          ],
        ]
      : [SYSTEM_PROMPT_CANDLES, buildCandlesUserPrompt(content.input)];

  let response;
  try {
    response = await client.messages.create({
      model: deep ? "claude-opus-5" : "claude-haiku-4-5",
      max_tokens: deep ? 16000 : 8192,
      ...(deep ? { thinking: { type: "adaptive" as const } } : {}),
      output_config: {
        format: { type: "json_schema", schema: buildSchema(deep ? "deep" : "standard") },
        ...(deep ? { effort: "high" as const } : {}),
      },
      system,
      messages: [{ role: "user", content: messageContent }],
    });
  } catch (error) {
    logAnthropicError("analyzeTradingChart", error);
    throw new AiServiceError("Échec de l'appel à l'API Anthropic pour l'analyse du graphique.");
  }

  if (response.stop_reason === "refusal") {
    console.error(
      `[anthropic-trading:analyzeTradingChart] refus de contenu — category=${response.stop_details?.category ?? "inconnue"}`
    );
    throw new AiServiceError("L'IA a refusé d'analyser cette image (contenu potentiellement sensible).");
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    console.error("[anthropic-trading:analyzeTradingChart] réponse sans bloc texte exploitable", response);
    throw new AiServiceError("Réponse de l'IA vide ou inattendue.");
  }

  if (hasDegenerateRepetition(textBlock.text)) {
    console.error(
      "[anthropic-trading:analyzeTradingChart] répétition dégénérée détectée dans la réponse:",
      truncateForLog(textBlock.text)
    );
    throw new MalformedVerdictError("Réponse de l'IA dégénérée (répétition anormale détectée).");
  }

  try {
    return JSON.parse(textBlock.text) as TradingChartVerdict;
  } catch (error) {
    console.error(
      "[anthropic-trading:analyzeTradingChart] JSON invalide dans la réponse:",
      truncateForLog(textBlock.text),
      error
    );
    throw new MalformedVerdictError("Réponse de l'IA mal formée (JSON invalide).");
  }
}

/** Same one-retry-on-malformed-response policy as analyze-market's own
 * analyzeMarket — see that function's comment for why. */
async function requestVerdictWithRetry(content: VerdictContent): Promise<TradingChartVerdict> {
  try {
    return await requestVerdictOnce(content);
  } catch (error) {
    if (!(error instanceof MalformedVerdictError)) throw error;
    console.warn(
      `[anthropic-trading:analyzeTradingChart] réponse inexploitable (${error.message}) — nouvelle tentative`
    );
    try {
      return await requestVerdictOnce(content);
    } catch (retryError) {
      if (retryError instanceof MalformedVerdictError) {
        throw new AiServiceError(retryError.message);
      }
      throw retryError;
    }
  }
}

export async function analyzeTradingChart(
  imageBase64: string,
  mediaType: string,
  depth: AnalysisDepth = "standard"
): Promise<TradingChartVerdict> {
  return requestVerdictWithRetry({ kind: "image", imageBase64, mediaType, depth });
}

/** Trading "Sélection du jour" entry point (scan-trading-pairs) — same
 * pipeline as analyzeTradingChart, fed live Binance candles instead of a
 * screenshot. instrument/timeframe are still taken from the model's own
 * JSON output (not overridden from `input`) for one reason: keeping a
 * single verdict shape/validation path for both flows, exactly like
 * analyzeSportMatch's predictedWinner is still read from the model even
 * though the caller already knows the two real team names — the schema's
 * enum/null constraints are what actually keep it honest. */
export async function analyzeTradingCandles(input: CandleAnalysisInput): Promise<TradingChartVerdict> {
  return requestVerdictWithRetry({ kind: "candles", input });
}
