import { createClient } from "@/lib/supabase/client";
import type { Sport, SportFixture } from "@/lib/sports/types";
import type { SportMatchAnalysis, SportMatchProgressStep } from "@/lib/data/sports-analysis";
import { sportMatchErrorMessage } from "@/lib/data/sports-analysis";

export class SportMatchAnalysisError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export type AnalyzeSportMatchRequest = {
  sport: Sport;
  homeTeamName: string;
  awayTeamName: string;
  competitionName: string | null;
  kickoffAt: string;
  recentMeetings: SportFixture[];
};

type StreamEvent =
  | { type: "progress"; step: SportMatchProgressStep }
  | { type: "result"; analysis: SportMatchAnalysis }
  | { type: "error"; code: string; message: string };

export async function runSportMatchAnalysis(
  request: AnalyzeSportMatchRequest,
  onProgress: (step: SportMatchProgressStep) => void
): Promise<SportMatchAnalysis> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new SportMatchAnalysisError("unauthorized", sportMatchErrorMessage("unauthorized"));
  }

  const functionsUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-sport-match`;

  let response: Response;
  try {
    response = await fetch(functionsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({
        sport: request.sport,
        homeTeamName: request.homeTeamName,
        awayTeamName: request.awayTeamName,
        competitionName: request.competitionName,
        kickoffAt: request.kickoffAt,
        recentMeetings: request.recentMeetings.map((m) => ({
          kickoffAt: m.kickoffAt,
          homeTeamName: m.homeTeamName,
          awayTeamName: m.awayTeamName,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          competitionName: m.competitionName,
        })),
      }),
    });
  } catch {
    throw new SportMatchAnalysisError("network_error", sportMatchErrorMessage("network_error"));
  }

  if (!response.body) {
    throw new SportMatchAnalysisError("network_error", "Réponse vide du serveur d'analyse.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: SportMatchAnalysis | null = null;

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
      throw new SportMatchAnalysisError(event.code, event.message);
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
    throw new SportMatchAnalysisError("unknown", sportMatchErrorMessage("unknown"));
  }
  if (!result) {
    throw new SportMatchAnalysisError("unknown", "L'analyse n'a retourné aucun résultat.");
  }

  return result;
}
