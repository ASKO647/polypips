"use client";

import { useTranslations } from "next-intl";
import { REACTION_EMOJIS } from "@/lib/data/community";
import { cn } from "@/lib/utils";
import type { MessageReactionEmoji } from "@/lib/data/community";

/** The floating quick-reaction row shown on hover (desktop) or long-press
 * (mobile) — see MessageBubble for the trigger logic, this component is
 * purely the popup itself. */
export function MessageReactionPicker({
  align,
  placement = "above",
  onPick,
}: {
  align: "start" | "end";
  /** "above" (default) opens over the bubble; "below" is used when the
   * bubble sits too close to the top of the scrollable message list for
   * "above" to fit without being clipped — see MessageBubble's openPicker. */
  placement?: "above" | "below";
  onPick: (emoji: MessageReactionEmoji) => void;
}) {
  const t = useTranslations("Community.MessageReactionPicker");
  return (
    <div
      className={cn(
        "absolute z-20 flex items-center gap-0.5 rounded-full border border-white/10 bg-[#1a0f0f] p-1 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]",
        placement === "above" ? "bottom-full mb-1.5" : "top-full mt-1.5",
        align === "end" ? "right-0" : "left-0"
      )}
    >
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onPick(emoji)}
          aria-label={t("reactWith", { emoji })}
          className="flex h-8 w-8 items-center justify-center rounded-full text-base transition-transform duration-100 hover:scale-125 active:scale-95"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
