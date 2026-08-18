"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { History as HistoryIcon, Loader2, X } from "lucide-react";
import { ChatInput } from "@/components/dashboard/coach/chat-input";
import { ChatMessage } from "@/components/dashboard/coach/chat-message";
import { CoachMobileHistory } from "@/components/dashboard/coach/coach-mobile-history";
import { CoachSidebar } from "@/components/dashboard/coach/coach-sidebar";
import { TypingIndicator } from "@/components/dashboard/coach/typing-indicator";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import {
  coachChatErrorMessage,
  WELCOME_MESSAGE,
  type ConversationSummary,
  type Message,
  type QuickQuestion,
} from "@/lib/data/coach";
import {
  CoachChatError,
  runCoachChat,
} from "@/lib/supabase/coach-chat-client";
import { createClient } from "@/lib/supabase/client";
import { fetchConversationMessages } from "@/lib/supabase/coach";

type FocusAnalysis = { id: string; question: string };

function errorContentFor(error: unknown): React.ReactNode {
  if (error instanceof CoachChatError && error.code === "limit_reached") {
    return (
      <>
        {error.message}{" "}
        <Link
          href="/dashboard/settings"
          className="font-semibold text-brand-400 underline underline-offset-2 hover:text-brand-300"
        >
          Changer de plan →
        </Link>
      </>
    );
  }
  return coachChatErrorMessage(
    error instanceof CoachChatError ? error.code : "unknown"
  );
}

export function CoachFlow({
  initialConversations,
  initialFocusAnalysis,
  hasActiveSubscription,
  cancelled,
}: {
  initialConversations: ConversationSummary[];
  initialFocusAnalysis: FocusAnalysis | null;
  hasActiveSubscription: boolean;
  /** True when access is blocked because the user cancelled — swaps the
   * "Débutez pour 0,99 €" first-time CTA for a "réabonnez-vous" one. */
  cancelled: boolean;
}) {
  const [conversations, setConversations] = useState<ConversationSummary[]>(
    initialConversations
  );
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<React.ReactNode | null>(
    null
  );
  const [focusAnalysis, setFocusAnalysis] = useState<FocusAnalysis | null>(
    initialFocusAnalysis
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, showTyping]);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ?? null;

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    setInputValue("");
    setErrorMessage(null);
    setFocusAnalysis(null);
  };

  const handleSelectConversation = async (id: string) => {
    if (id === activeConversationId) return;
    setErrorMessage(null);
    setFocusAnalysis(null);
    setActiveConversationId(id);
    setLoadingConversation(true);
    try {
      const supabase = createClient();
      const msgs = await fetchConversationMessages(supabase, id);
      setMessages(msgs.length > 0 ? msgs : [WELCOME_MESSAGE]);
    } finally {
      setLoadingConversation(false);
    }
  };

  const bumpConversation = (id: string, title: string) => {
    setConversations((prev) => {
      const existingIdx = prev.findIndex((c) => c.id === id);
      const updated: ConversationSummary = {
        id,
        title,
        updatedAt: new Date().toISOString(),
      };
      if (existingIdx === -1) return [updated, ...prev];
      const rest = prev.filter((c) => c.id !== id);
      return [updated, ...rest];
    });
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending || !hasActiveSubscription) return;

    setErrorMessage(null);
    setInputValue("");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
    ]);
    setSending(true);
    setShowTyping(true);

    const assistantId = crypto.randomUUID();
    let assistantStarted = false;
    const conversationIdAtSend = activeConversationId;

    try {
      const result = await runCoachChat(
        {
          conversationId: conversationIdAtSend,
          message: trimmed,
          focusAnalysisId: conversationIdAtSend
            ? undefined
            : (focusAnalysis?.id ?? undefined),
        },
        (delta) => {
          if (!assistantStarted) {
            assistantStarted = true;
            setShowTyping(false);
            setMessages((prev) => [
              ...prev,
              { id: assistantId, role: "assistant", content: delta },
            ]);
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + delta } : m
              )
            );
          }
        }
      );

      setFocusAnalysis(null);
      if (!conversationIdAtSend) {
        setActiveConversationId(result.conversationId);
      }
      bumpConversation(result.conversationId, result.title);
    } catch (error) {
      setErrorMessage(errorContentFor(error));
    } finally {
      setShowTyping(false);
      setSending(false);
    }
  };

  const handleSelectSuggestion = (question: QuickQuestion) => {
    handleSend(question.label);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[520px] gap-4">
      <CoachSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />

      <LockedOverlay
        locked={!hasActiveSubscription}
        cancelled={cancelled}
        message={
          cancelled
            ? "Abonnement annulé — réabonnez-vous pour continuer à utiliser le Coach IA."
            : "Débloquez le Coach IA — Débutez pour 0,99 €"
        }
        className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
        contentClassName="flex flex-1 flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/15">
              <Image
                src="/polypips-mark.png"
                alt=""
                width={290}
                height={322}
                className="h-4 w-auto"
              />
            </span>
            <div>
              <p className="font-display text-sm font-bold text-white">
                Coach IA
              </p>
              <p className="max-w-[220px] truncate text-[11px] text-white/40 sm:max-w-xs">
                {activeConversation
                  ? activeConversation.title
                  : "Nouvelle conversation"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors duration-150 hover:text-white lg:hidden"
          >
            <HistoryIcon className="h-3.5 w-3.5" />
            Historique
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {loadingConversation ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-white/40" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {showTyping && <TypingIndicator />}
            </div>
          )}
        </div>

        {focusAnalysis && !activeConversationId && (
          <div className="mx-4 mb-3 flex items-center justify-between gap-2 rounded-xl border border-brand-500/20 bg-brand-500/[0.06] px-3.5 py-2.5 text-xs text-white/70 sm:mx-5">
            <span className="truncate">
              Contexte : {focusAnalysis.question}
            </span>
            <button
              type="button"
              onClick={() => setFocusAnalysis(null)}
              aria-label="Retirer le contexte"
              className="shrink-0 text-white/40 transition-colors hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mx-4 mb-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3.5 py-2.5 text-xs leading-relaxed text-rose-300 sm:mx-5">
            {errorMessage}
          </div>
        )}

        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={() => handleSend(inputValue)}
          onSelectSuggestion={handleSelectSuggestion}
          disabled={sending || !hasActiveSubscription}
        />
      </LockedOverlay>

      <CoachMobileHistory
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
    </div>
  );
}
