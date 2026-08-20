import Anthropic from "npm:@anthropic-ai/sdk@0.116.0";

const client = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
});

/** Thrown for genuine Anthropic API failures (auth, credit, quota, network,
 * server errors) — mirrors AiServiceError in analyze-market/anthropic-analysis.ts
 * so both Edge Functions report AI outages the same way. */
export class AiServiceError extends Error {}

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

export type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Streams the coach's reply, invoking onDelta as each text chunk arrives
 * (real token streaming, not a simulated delay), and resolves with the
 * complete response text once generation finishes.
 */
export async function streamCoachReply(
  systemPrompt: string,
  messages: ChatMessage[],
  onDelta: (text: string) => void
): Promise<string> {
  const stream = client.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: 1536,
    system: systemPrompt,
    messages,
  });

  stream.on("text", (delta) => onDelta(delta));

  try {
    return await stream.finalText();
  } catch (error) {
    logAnthropicError("streamCoachReply", error);
    throw new AiServiceError(
      "Échec de l'appel à l'API Anthropic pour la réponse du coach."
    );
  }
}
