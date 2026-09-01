import { createClient } from "@/lib/supabase/client";
import type { Sport, SportSearchResult } from "@/lib/sports/types";
import { sportMatchErrorMessage } from "@/lib/data/sports-analysis";

export class SportMatchSearchError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function searchSportMatch(
  sport: Sport,
  team1: string,
  team2: string
): Promise<SportSearchResult> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new SportMatchSearchError("unauthorized", sportMatchErrorMessage("unauthorized"));
  }

  const functionsUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sport-match-search`;

  let response: Response;
  try {
    response = await fetch(functionsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ sport, team1, team2 }),
    });
  } catch {
    throw new SportMatchSearchError("network_error", sportMatchErrorMessage("network_error"));
  }

  let data: Record<string, unknown>;
  try {
    data = await response.json();
  } catch {
    throw new SportMatchSearchError("unknown", sportMatchErrorMessage("unknown"));
  }

  if (!response.ok) {
    const code = typeof data.error === "string" ? data.error : "unknown";
    const message = typeof data.message === "string" ? data.message : sportMatchErrorMessage(code);
    throw new SportMatchSearchError(code, message);
  }

  return data as unknown as SportSearchResult;
}
