import { createClient } from "@/lib/supabase/client";
import type { Artifact, ArtifactType, ContextSource } from "@/lib/data/coach";

export class CoachChatError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export type CoachChatRequest = {
  conversationId: string | null;
  message: string;
  focusAnalysisId?: string;
  /** Omit to keep the conversation's current toggles; pass an array
   * (including []) to change them for this and future turns. */
  enabledContext?: ContextSource[];
  attachmentIds?: string[];
  requestArtifact?: boolean;
};

export type CoachChatResult = {
  conversationId: string;
  title: string;
  sourcesUsed: ContextSource[];
  showDisclaimer: boolean;
  artifact: Artifact | null;
};

type StreamEvent =
  | { type: "sources"; sources: ContextSource[] }
  | { type: "delta"; text: string }
  | { type: "artifact"; artifactId: string; artifactType: ArtifactType; payload: unknown }
  | { type: "done"; conversationId: string; title: string; showDisclaimer: boolean }
  | { type: "error"; code: string; message: string };

export async function runCoachChat(
  request: CoachChatRequest,
  onDelta: (text: string) => void,
  onSources?: (sources: ContextSource[]) => void
): Promise<CoachChatResult> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new CoachChatError(
      "unauthorized",
      "Votre session a expiré. Reconnectez-vous et réessayez."
    );
  }

  const functionsUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/coach-chat`;

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
    throw new CoachChatError(
      "network_error",
      "Connexion impossible. Vérifiez votre connexion et réessayez."
    );
  }

  if (!response.body) {
    throw new CoachChatError("network_error", "Réponse vide du serveur du coach.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sourcesUsed: ContextSource[] = [];
  let artifact: Artifact | null = null;
  let result: CoachChatResult | null = null;

  const handleLine = (line: string) => {
    if (!line.trim()) return;
    let event: StreamEvent;
    try {
      event = JSON.parse(line);
    } catch {
      return;
    }
    if (event.type === "sources") {
      sourcesUsed = event.sources;
      onSources?.(event.sources);
    } else if (event.type === "delta") {
      onDelta(event.text);
    } else if (event.type === "artifact") {
      artifact = {
        id: event.artifactId,
        type: event.artifactType,
        payload: event.payload as Artifact["payload"],
        createdAt: new Date().toISOString(),
      };
    } else if (event.type === "done") {
      result = {
        conversationId: event.conversationId,
        title: event.title,
        sourcesUsed,
        showDisclaimer: event.showDisclaimer,
        artifact,
      };
    } else if (event.type === "error") {
      throw new CoachChatError(event.code, event.message);
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
    throw new CoachChatError("unknown", "Une erreur inattendue est survenue. Réessayez.");
  }
  if (!result) {
    throw new CoachChatError("unknown", "Le coach n'a retourné aucune réponse.");
  }

  return result;
}
