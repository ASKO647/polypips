export type MessageRole = "user" | "assistant";

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
};

/** Lightweight sidebar entry — full messages are only fetched once a
 * conversation is actually opened (see lib/supabase/coach.ts). */
export type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type QuickQuestion = {
  id: string;
  label: string;
};

/** Ids for the quick-suggestion chips in ChatInput — labels (sent as real
 * messages to the AI, with the usual analysis context attached, not canned
 * responses) live in "Coach.ChatInput.quickQuestions" so callers can build
 * the localized QuickQuestion[] via t.raw(). */
export const QUICK_QUESTION_IDS = [
  "why-decision",
  "main-risks",
  "what-could-invalidate",
  "compare-recent",
] as const;

export type CoachChatErrorCode =
  | "invalid_input"
  | "unauthorized"
  | "ai_error"
  | "limit_reached"
  | "subscription_required"
  | "network_error"
  | "unknown";

const KNOWN_ERROR_CODES: CoachChatErrorCode[] = [
  "invalid_input",
  "unauthorized",
  "ai_error",
  "limit_reached",
  "subscription_required",
  "network_error",
];

type CoachTranslator = (key: string) => string;

/** Error copy lives in "Coach.errors" — call with a translator scoped to
 * "Coach". Codes the server sends that this UI doesn't recognize fall back
 * to `errors.unknown`, same as before. */
export function coachChatErrorMessage(code: string, t: CoachTranslator): string {
  const key = KNOWN_ERROR_CODES.includes(code as CoachChatErrorCode)
    ? (code as CoachChatErrorCode)
    : "unknown";
  return t(`errors.${key}`);
}
