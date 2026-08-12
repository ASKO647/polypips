"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { History as HistoryIcon } from "lucide-react";
import { ChatInput } from "@/components/dashboard/coach/chat-input";
import { ChatMessage } from "@/components/dashboard/coach/chat-message";
import { CoachMobileHistory } from "@/components/dashboard/coach/coach-mobile-history";
import { CoachSidebar } from "@/components/dashboard/coach/coach-sidebar";
import { TypingIndicator } from "@/components/dashboard/coach/typing-indicator";
import {
  GENERIC_FALLBACK_RESPONSE,
  WELCOME_MESSAGE,
  type Conversation,
  type Message,
  type QuickQuestion,
} from "@/lib/data/coach";

export function CoachFlow({
  initialConversations,
}: {
  initialConversations: Conversation[];
}) {
  const [conversations] = useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ?? null;

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    setInputValue("");
  };

  const handleSelectConversation = (id: string) => {
    const conversation = conversations.find((c) => c.id === id);
    if (!conversation) return;
    setActiveConversationId(id);
    setMessages(conversation.messages);
    setInputValue("");
  };

  const respondTo = (userText: string, matchedQuestion?: QuickQuestion) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userText,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    window.setTimeout(
      () => {
        const responseText = matchedQuestion
          ? matchedQuestion.response
          : GENERIC_FALLBACK_RESPONSE;
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: responseText },
        ]);
        setIsTyping(false);
      },
      1100 + Math.random() * 500
    );
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue("");
    respondTo(text);
  };

  const handleSelectSuggestion = (question: QuickQuestion) => {
    respondTo(question.label, question);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[520px] gap-4">
      <CoachSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
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
              <p className="text-[11px] text-white/40">
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
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && <TypingIndicator />}
          </div>
        </div>

        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          onSelectSuggestion={handleSelectSuggestion}
          disabled={isTyping}
        />
      </div>

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
