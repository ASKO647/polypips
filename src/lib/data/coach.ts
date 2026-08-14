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

export const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Bonjour ! Je suis votre coach IA Polypips. Posez-moi une question sur vos analyses récentes.",
};

/** Sent as real messages to the AI (with the usual analysis context
 * attached) — not canned responses. */
export const QUICK_QUESTIONS: QuickQuestion[] = [
  {
    id: "why-decision",
    label: "Pourquoi l'IA a pris cette décision ?",
  },
  {
    id: "main-risks",
    label: "Quels sont les principaux risques ?",
  },
  {
    id: "what-could-invalidate",
    label: "Qu'est-ce qui pourrait invalider cette analyse ?",
  },
  {
    id: "compare-recent",
    label: "Compare mes analyses récentes.",
  },
];

export type CoachChatErrorCode =
  | "invalid_input"
  | "unauthorized"
  | "ai_error"
  | "limit_reached"
  | "subscription_required"
  | "network_error"
  | "unknown";

const COACH_ERROR_MESSAGES: Record<CoachChatErrorCode, string> = {
  invalid_input: "Message invalide.",
  unauthorized: "Votre session a expiré. Reconnectez-vous et réessayez.",
  ai_error:
    "Le service d'assistance IA est temporairement indisponible. Réessayez dans quelques instants.",
  limit_reached:
    "Vous avez atteint votre limite de messages Coach IA cette semaine. Passez à Pro+ pour des messages illimités.",
  subscription_required: "Le Coach IA est réservé aux abonnés. Débutez pour 0,99 € pour y accéder.",
  network_error: "Connexion impossible. Vérifiez votre connexion et réessayez.",
  unknown: "Une erreur inattendue est survenue. Réessayez.",
};

export function coachChatErrorMessage(code: string): string {
  return COACH_ERROR_MESSAGES[code as CoachChatErrorCode] ?? COACH_ERROR_MESSAGES.unknown;
}
