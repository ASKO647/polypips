import { createClient } from "@/lib/supabase/client";
import type { SignalAnalysis, SignalAnalysisProgressStep, SignalBetFormInput } from "@/lib/data/signal-analysis";

export class SignalAnalysisRequestError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export type AnalyzeSignalBetRequest =
  | { type: "manual"; source: "fomo" | "axiom"; bet: SignalBetFormInput }
  | { type: "image"; source: "fomo" | "axiom"; imageBase64: string; imageMediaType: string }
  | { type: "link"; source: "fomo" | "axiom"; link: string };

type StreamEvent =
  | { type: "progress"; step: SignalAnalysisProgressStep }
  | { type: "result"; analysis: SignalAnalysis }
  | { type: "error"; code: string; message: string };

export async function runSignalBetAnalysis(
  request: AnalyzeSignalBetRequest,
  onProgress: (step: SignalAnalysisProgressStep) => void
): Promise<SignalAnalysis> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new SignalAnalysisRequestError(
      "unauthorized",
      "Votre session a expiré. Reconnectez-vous et réessayez."
    );
  }

  const functionsUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-signal-bet`;

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
    throw new SignalAnalysisRequestError(
      "network_error",
      "Connexion impossible. Vérifiez votre connexion et réessayez."
    );
  }

  if (!response.body) {
    throw new SignalAnalysisRequestError("network_error", "Réponse vide du serveur d'analyse.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: SignalAnalysis | null = null;

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
      throw new SignalAnalysisRequestError(event.code, event.message);
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
    throw new SignalAnalysisRequestError("unknown", "Une erreur inattendue est survenue. Réessayez.");
  }
  if (!result) {
    throw new SignalAnalysisRequestError("unknown", "L'analyse n'a retourné aucun résultat.");
  }

  return result;
}
