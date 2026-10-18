export type MessageRole = "user" | "assistant";

/** Mirrors ContextSource in supabase/functions/_shared/coach-context.ts —
 * kept in sync by hand, same convention as every other Edge
 * Function/frontend type pair in this codebase. */
export type ContextSource =
  | "polymarket_analyses"
  | "sport_analyses"
  | "trading_analyses"
  | "selected_today"
  | "smart_wallet"
  | "past_conversations";

export const CONTEXT_SOURCES: ContextSource[] = [
  "polymarket_analyses",
  "sport_analyses",
  "trading_analyses",
  "selected_today",
  "smart_wallet",
  "past_conversations",
];

export type AttachmentKind = "image" | "pdf" | "csv";

export type MessageAttachment = {
  fileName: string;
  kind: AttachmentKind;
};

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  /** Server-computed, never model-reported — which context sources
   * actually had data for this reply (see assembleContext). Only ever
   * set on assistant messages. */
  sourcesUsed?: ContextSource[];
  /** Whether to show the persistent trading/betting-decision disclaimer
   * under this reply. */
  showDisclaimer?: boolean;
  /** Only set on the user's own messages, for display purposes
   * (uploaded before this message was sent). */
  attachments?: MessageAttachment[];
};

/** Mirrors supabase/functions/coach-chat/artifact-tools.ts's payload
 * types — kept in sync by hand. */
export type ComparisonTablePayload = {
  title: string;
  metric_labels: string[];
  rows: { label: string; metric_values: string[]; note: string }[];
  conclusion: string;
};

export type ReportPayload = {
  title: string;
  summary: string;
  sections: { heading: string; body: string }[];
};

export type ChecklistPayload = {
  title: string;
  items: string[];
};

export type RiskSummaryPayload = {
  title: string;
  risk_level: "Faible" | "Moyenne" | "Élevée";
  key_risks: string[];
  mitigations: string[];
};

export type SurveillancePlanPayload = {
  title: string;
  watch_items: { label: string; trigger_condition: string }[];
  review_frequency: string;
};

export type ArtifactType = "comparison_table" | "report" | "checklist" | "risk_summary" | "surveillance_plan";

export type Artifact = {
  id: string;
  type: ArtifactType;
  payload:
    | ComparisonTablePayload
    | ReportPayload
    | ChecklistPayload
    | RiskSummaryPayload
    | SurveillancePlanPayload;
  createdAt: string;
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

/** Translation key suffix (relative to "Coach.ContextSelector.sources")
 * for each context source — labels live in messages/{locale}/coach.json,
 * never hardcoded here. */
export function contextSourceLabelKey(source: ContextSource): string {
  return source;
}

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
