import { createClient } from "@/lib/supabase/client";
import type { TradingChartAnalysis, TradingProgressStep } from "@/lib/data/trading-analysis";
import { tradingErrorMessage } from "@/lib/data/trading-analysis";

export class TradingAnalysisError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export type AnalyzeTradingChartRequest = {
  imageBase64: string;
  imageMediaType: string;
};

type StreamEvent =
  | { type: "progress"; step: TradingProgressStep }
  | { type: "result"; analysis: TradingChartAnalysis }
  | { type: "error"; code: string; message: string };

export async function runTradingChartAnalysis(
  request: AnalyzeTradingChartRequest,
  onProgress: (step: TradingProgressStep) => void
): Promise<TradingChartAnalysis> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new TradingAnalysisError("unauthorized", tradingErrorMessage("unauthorized"));
  }

  const functionsUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-trading-chart`;

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
    throw new TradingAnalysisError("network_error", tradingErrorMessage("network_error"));
  }

  if (!response.body) {
    throw new TradingAnalysisError("network_error", "Réponse vide du serveur d'analyse.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: TradingChartAnalysis | null = null;

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
      throw new TradingAnalysisError(event.code, event.message);
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
    throw new TradingAnalysisError("unknown", tradingErrorMessage("unknown"));
  }
  if (!result) {
    throw new TradingAnalysisError("unknown", "L'analyse n'a retourné aucun résultat.");
  }

  return result;
}
