import Anthropic from "npm:@anthropic-ai/sdk@0.116.0";
import { AiServiceError } from "../analyze-market/anthropic-analysis.ts";

/**
 * The Smart Wallets universe's interactive "Analyse IA" — analyzes ONE
 * Fomo/Axiom wallet trade the user submits (screenshot or manual entry),
 * in the same spirit as analyze-sports-bet/anthropic-sports-analysis.ts
 * but for Solana memecoin trades rather than sports bets: no market to
 * fetch, no automatic resolution later, the model works only from what
 * the user provides plus its own general knowledge. AiServiceError is
 * reused from analyze-market — a plain error-type marker, safe to share.
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
    console.error(`[anthropic-signal:${context}] status=${error.status} name=${error.name} message=${error.message}`);
    return;
  }
  if (error instanceof Error) {
    console.error(`[anthropic-signal:${context}] ${error.name}: ${error.message}`);
    return;
  }
  console.error(`[anthropic-signal:${context}] erreur non typée:`, error);
}

export type SignalBetInput = {
  source: "fomo" | "axiom";
  walletAddress: string;
  tokenSymbol: string;
  side: "BUY" | "SELL";
  amountUsd: string;
  price: string;
  marketCap: string;
  liquidity: string;
  volume24h: string;
};

export type SignalBetVerdict = {
  polypipsScore: number;
  summary: string;
  positives: string[];
  risks: string[];
  conclusion: string;
  decision: "COPY" | "IGNORE";
};

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    polypipsScore: {
      type: "integer",
      description: "Score PolyPips (0-100) reflétant la qualité globale de ce trade — wallet + token + contexte de marché.",
    },
    summary: {
      type: "string",
      description: "Résumé clair (2-4 phrases) de ce que ce trade représente et de son contexte.",
    },
    positives: {
      type: "array",
      items: { type: "string" },
      description: "2 à 5 points positifs concrets appuyant ce trade.",
    },
    risks: {
      type: "array",
      items: { type: "string" },
      description: "2 à 5 risques concrets (liquidité, volatilité, historique du wallet, stade du token, etc.).",
    },
    conclusion: {
      type: "string",
      description: "Conclusion synthétique (1-2 phrases), toujours au conditionnel/probabiliste.",
    },
    decision: {
      type: "string",
      enum: ["COPY", "IGNORE"],
      description: "COPY si les données disponibles rendent ce trade globalement favorable pour une éventuelle réplication, IGNORE sinon.",
    },
  },
  required: ["polypipsScore", "summary", "positives", "risks", "conclusion", "decision"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `Tu es l'analyste IA "Smart Wallets" de Polypips, spécialisé dans l'analyse de wallets et de trades de memecoins (tokens Solana) repérés via des terminaux comme Fomo ou Axiom.

Règles impératives, sans exception :
- Les memecoins sont des actifs extrêmement volatils et spéculatifs : ne présente JAMAIS une analyse comme une garantie de gain, et rappelle implicitement le risque de perte totale du capital quand c'est pertinent.
- Reste toujours au conditionnel/probabiliste ("pourrait", "semble", "estimation") — jamais affirmatif sur un résultat futur.
- Ne recommande JAMAIS de montant précis à investir ni n'encourage à engager plus que ce que l'utilisateur envisage déjà.
- Base ton analyse uniquement sur les données fournies (wallet, token, montant, prix, market cap, liquidité, volume) et tes connaissances générales sur l'évaluation de tokens/wallets — n'invente jamais de statistiques précises que tu ne peux pas connaître (ex: un win rate exact non fourni).
- Une liquidité très faible, un market cap très faible, ou un ratio volume/liquidité anormalement élevé sont des signaux de risque élevé (token à un stade précoce, possible manipulation) à signaler explicitement.
- "decision" doit refléter honnêtement l'équilibre risques/points positifs — ne choisis pas COPY par défaut.`;

function buildUserPrompt(input: SignalBetInput): string {
  return `Analyse ce trade réel repéré sur ${input.source === "fomo" ? "Fomo" : "Axiom"} :

WALLET : ${input.walletAddress || "non fourni"}
TOKEN : ${input.tokenSymbol}
SENS : ${input.side === "BUY" ? "ACHAT" : "VENTE"}
MONTANT : ${input.amountUsd || "non fourni"} $
PRIX : ${input.price || "non fourni"}
MARKET CAP : ${input.marketCap || "non fourni"}
LIQUIDITÉ : ${input.liquidity || "non fournie"}
VOLUME 24H : ${input.volume24h || "non fourni"}

Produis ton verdict structuré sur ce trade précis, à partir des données ci-dessus.`;
}

async function requestVerdictOnce(input: SignalBetInput): Promise<SignalBetVerdict> {
  let response;
  try {
    response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 8192,
      output_config: { format: { type: "json_schema", schema: VERDICT_SCHEMA } },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });
  } catch (error) {
    logAnthropicError("analyzeSignalBet", error);
    throw new AiServiceError("Échec de l'appel à l'API Anthropic pour le verdict d'analyse.");
  }

  if (response.stop_reason === "refusal") {
    console.error(`[anthropic-signal:analyzeSignalBet] refus de contenu — category=${response.stop_details?.category ?? "inconnue"}`);
    throw new AiServiceError("L'IA a refusé d'analyser ce trade (contenu potentiellement sensible).");
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    console.error("[anthropic-signal:analyzeSignalBet] réponse sans bloc texte exploitable", response);
    throw new AiServiceError("Réponse de l'IA vide ou inattendue.");
  }

  if (hasDegenerateRepetition(textBlock.text)) {
    console.error("[anthropic-signal:analyzeSignalBet] répétition dégénérée détectée:", truncateForLog(textBlock.text));
    throw new MalformedVerdictError("Réponse de l'IA dégénérée (répétition anormale détectée).");
  }

  try {
    return JSON.parse(textBlock.text) as SignalBetVerdict;
  } catch (error) {
    console.error("[anthropic-signal:analyzeSignalBet] JSON invalide:", truncateForLog(textBlock.text), error);
    throw new MalformedVerdictError("Réponse de l'IA mal formée (JSON invalide).");
  }
}

/** Same one-retry-on-malformed-response policy as analyze-market /
 * analyze-sports-bet. */
export async function analyzeSignalBet(input: SignalBetInput): Promise<SignalBetVerdict> {
  try {
    return await requestVerdictOnce(input);
  } catch (error) {
    if (!(error instanceof MalformedVerdictError)) throw error;
    console.warn(`[anthropic-signal:analyzeSignalBet] réponse inexploitable (${error.message}) — nouvelle tentative`);
    try {
      return await requestVerdictOnce(input);
    } catch (retryError) {
      if (retryError instanceof MalformedVerdictError) throw new AiServiceError(retryError.message);
      throw retryError;
    }
  }
}

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    readable: {
      type: "boolean",
      description: "true si tu identifies clairement un trade wallet/token dans l'image ; false sinon.",
    },
    walletAddress: { type: "string", description: "Adresse du wallet telle qu'affichée, ou chaîne vide." },
    tokenSymbol: { type: "string", description: "Symbole du token tel qu'affiché, ou chaîne vide." },
    side: { type: "string", enum: ["BUY", "SELL", ""], description: "ACHAT->BUY, VENTE->SELL, ou vide si ambigu." },
    amountUsd: { type: "string", description: "Montant du trade en dollars tel qu'affiché, ou chaîne vide." },
    price: { type: "string", description: "Prix du token tel qu'affiché, ou chaîne vide." },
    marketCap: { type: "string", description: "Market cap tel qu'affiché, ou chaîne vide." },
    liquidity: { type: "string", description: "Liquidité telle qu'affichée, ou chaîne vide." },
    volume24h: { type: "string", description: "Volume 24h tel qu'affiché, ou chaîne vide." },
  },
  required: ["readable", "walletAddress", "tokenSymbol", "side", "amountUsd", "price", "marketCap", "liquidity", "volume24h"],
  additionalProperties: false,
} as const;

const EXTRACTION_PROMPT = `Cette image est une capture d'écran d'un terminal de trading de memecoins Solana (Fomo, Axiom, ou similaire).

Ta tâche : identifier un trade précis affiché — l'adresse du wallet (si visible), le token, le sens (achat/vente), le montant, le prix, le market cap, la liquidité, le volume 24h.

Recopie les valeurs MOT POUR MOT telles qu'affichées. Ne traduis pas, ne reformule pas, n'invente aucune valeur non visible.

Si l'image montre plusieurs trades, choisis celui le plus clairement mis en avant. Si aucun trade n'est identifiable avec certitude, réponds avec readable=false et laisse les autres champs vides.`;

export async function extractSignalFromImage(imageBase64: string, mediaType: string): Promise<SignalBetInput | null> {
  let response;
  try {
    response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      output_config: { format: { type: "json_schema", schema: EXTRACTION_SCHEMA } },
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
    logAnthropicError("extractSignalFromImage", error);
    throw new AiServiceError("Échec de l'appel à l'API Anthropic pour la lecture de l'image.");
  }

  if (response.stop_reason === "refusal") {
    console.warn("[anthropic-signal:extractSignalFromImage] refus de contenu sur l'image fournie");
    return null;
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    console.warn("[anthropic-signal:extractSignalFromImage] réponse sans bloc texte exploitable");
    return null;
  }

  let parsed: {
    readable: boolean;
    walletAddress: string;
    tokenSymbol: string;
    side: "BUY" | "SELL" | "";
    amountUsd: string;
    price: string;
    marketCap: string;
    liquidity: string;
    volume24h: string;
  };
  try {
    parsed = JSON.parse(textBlock.text);
  } catch (error) {
    console.warn("[anthropic-signal:extractSignalFromImage] JSON invalide dans la réponse", error);
    return null;
  }

  if (!parsed.readable || !parsed.tokenSymbol || !parsed.side) {
    console.warn("[anthropic-signal:extractSignalFromImage] trade jugé illisible par le modèle");
    return null;
  }

  return {
    source: "fomo",
    walletAddress: parsed.walletAddress,
    tokenSymbol: parsed.tokenSymbol,
    side: parsed.side,
    amountUsd: parsed.amountUsd,
    price: parsed.price,
    marketCap: parsed.marketCap,
    liquidity: parsed.liquidity,
    volume24h: parsed.volume24h,
  };
}
