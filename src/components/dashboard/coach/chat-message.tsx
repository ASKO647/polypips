import Image from "next/image";
import { useTranslations } from "next-intl";
import { Paperclip, TriangleAlert } from "lucide-react";
import type { Message } from "@/lib/data/coach";
import { SafeMarkdown } from "@/components/dashboard/coach/safe-markdown";
import { cn } from "@/lib/utils";

export function ChatMessage({
  message,
  onViewArtifacts,
}: {
  message: Message;
  /** Present only when this reply produced an artifact — jumps to the
   * Artefacts tab instead of cluttering the chat with the full
   * structured result (see CoachFlow's tab switch). */
  onViewArtifacts?: () => void;
}) {
  const t = useTranslations("Coach");
  const isUser = message.role === "user";

  return (
    <div className={cn("flex items-end gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
      {!isUser && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/15">
          <Image src="/polypips-mark.png" alt="" width={290} height={322} className="h-4 w-auto" />
        </span>
      )}
      <div className={cn("flex max-w-[80%] flex-col gap-1.5 sm:max-w-[70%]", isUser && "items-end")}>
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.attachments.map((att, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-white/60"
              >
                <Paperclip className="h-3 w-3" />
                {att.fileName}
              </span>
            ))}
          </div>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-br-md bg-brand-500 text-white"
              : "rounded-bl-md border border-white/10 bg-white/[0.05] text-white/85"
          )}
        >
          {isUser ? message.content : <SafeMarkdown text={message.content} />}
        </div>

        {!isUser && onViewArtifacts && (
          <button
            type="button"
            onClick={onViewArtifacts}
            className="text-xs font-semibold text-brand-400 transition-colors hover:text-brand-300"
          >
            {t("viewArtifactCta")}
          </button>
        )}

        {!isUser && message.showDisclaimer && (
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-white/40">
            <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
            {t("tradingDisclaimer")}
          </p>
        )}
      </div>
    </div>
  );
}
