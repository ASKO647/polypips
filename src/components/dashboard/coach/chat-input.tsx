"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { QUICK_QUESTION_IDS, type QuickQuestion } from "@/lib/data/coach";
import {
  COACH_ATTACHMENT_ALLOWED_TYPES,
  CoachAttachmentError,
  uploadCoachAttachment,
  type UploadedCoachAttachment,
} from "@/lib/supabase/coach-attachments";
import { createClient } from "@/lib/supabase/client";

export function ChatInput({
  value,
  onChange,
  onSend,
  onSelectSuggestion,
  disabled,
  userId,
  attachments,
  onAttachmentsChange,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onSelectSuggestion: (question: QuickQuestion) => void;
  disabled: boolean;
  /** null for a logged-out/no-access state — the picker is hidden then. */
  userId: string | null;
  attachments: UploadedCoachAttachment[];
  onAttachmentsChange: (next: UploadedCoachAttachment[]) => void;
}) {
  const t = useTranslations("Coach.ChatInput");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const quickQuestionLabels = t.raw("quickQuestions") as Record<
    (typeof QUICK_QUESTION_IDS)[number],
    string
  >;
  const quickQuestions: QuickQuestion[] = QUICK_QUESTION_IDS.map((id) => ({
    id,
    label: quickQuestionLabels[id],
  }));

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;

    setAttachmentError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const uploaded = await uploadCoachAttachment(supabase, userId, file);
      onAttachmentsChange([...attachments, uploaded]);
    } catch (err) {
      setAttachmentError(
        err instanceof CoachAttachmentError ? err.message : t("attachmentUploadFailed")
      );
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter((a) => a.id !== id));
  };

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

      {attachments.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {attachments.map((att) => (
            <span
              key={att.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-white/60"
            >
              <Paperclip className="h-3 w-3" />
              {att.fileName}
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                aria-label={t("removeAttachmentAria")}
                className="text-white/40 transition-colors hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {attachmentError && <p className="mb-2 text-xs text-rose-400">{attachmentError}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className="flex items-center gap-2"
      >
        {userId && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={COACH_ATTACHMENT_ALLOWED_TYPES.join(",")}
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={handlePickFile}
              disabled={disabled || uploading}
              aria-label={t("attachAria")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </button>
          </>
        )}
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
