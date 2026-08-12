import { createClient } from "@/lib/supabase/client";
import type { AnalysisProgressStep, MarketAnalysis } from "@/lib/data/analysis";

export class AnalysisRequestError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export type AnalyzeMarketRequest =
  | { type: "link"; link: string }
  | { type: "image"; imageBase64: string; imageMediaType: string };

type StreamEvent =
  | { type: "progress"; step: AnalysisProgressStep }
  | { type: "result"; analysis: MarketAnalysis }
  | { type: "error"; code: string; message: string };

export async function runMarketAnalysis(
  request: AnalyzeMarketRequest,
  onProgress: (step: AnalysisProgressStep) => void
): Promise<MarketAnalysis> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new AnalysisRequestError(
      "unauthorized",
      "Votre session a expiré. Reconnectez-vous et réessayez."
    );
  }

  const functionsUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-market`;

  let response: Response;
  try {
    response = await fetch(functionsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify(request),
    });
  } catch {
    throw new AnalysisRequestError(
      "network_error",
      "Connexion impossible. Vérifiez votre connexion et réessayez."
    );
  }

  if (!response.body) {
    throw new AnalysisRequestError(
      "network_error",
      "Réponse vide du serveur d'analyse."
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: MarketAnalysis | null = null;

  const handleLine = (line: string) => {
    if (!line.trim()) return;
    let event: StreamEvent;
    try {
      event = JSON.parse(line);
    } catch {
      return;
    }
    if (event.type === "progress") {
      onProgress(event.step);
    } else if (event.type === "result") {
      result = event.analysis;
    } else if (event.type === "error") {
      throw new AnalysisRequestError(event.code, event.message);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) handleLine(line);
  }
  if (buffer.trim()) handleLine(buffer);

  if (!response.ok && !result) {
    throw new AnalysisRequestError(
      "unknown",
      "Une erreur inattendue est survenue. Réessayez."
    );
  }

  if (!result) {
    throw new AnalysisRequestError(
      "unknown",
      "L'analyse n'a retourné aucun résultat."
    );
  }

  return result;
}
