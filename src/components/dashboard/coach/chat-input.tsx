"use client";

import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { QUICK_QUESTION_IDS, type QuickQuestion } from "@/lib/data/coach";

export function ChatInput({
  value,
  onChange,
  onSend,
  onSelectSuggestion,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onSelectSuggestion: (question: QuickQuestion) => void;
  disabled: boolean;
}) {
  const t = useTranslations("Coach.ChatInput");
  const quickQuestionLabels = t.raw("quickQuestions") as Record<
    (typeof QUICK_QUESTION_IDS)[number],
    string
  >;
  const quickQuestions: QuickQuestion[] = QUICK_QUESTION_IDS.map((id) => ({
    id,
    label: quickQuestionLabels[id],
  }));

  return (
    <div className="border-t border-white/10 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {quickQuestions.map((question) => (
          <button
            key={question.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectSuggestion(question)}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/60 transition-colors duration-150 hover:border-white/25 hover:text-white disabled:pointer-events-none disabled:opacity-50"
          >
            {question.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("placeholder")}
          disabled={disabled}
          className="w-full rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/25 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || value.trim() === ""}
          aria-label={t("sendAria")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-transform duration-150 ease-out hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
