"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Flag, SmilePlus } from "lucide-react";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { MessageReactionPicker } from "@/components/dashboard/community/message-reaction-picker";
import { PhotoLightbox } from "@/components/dashboard/community/photo-lightbox";
import { VoiceMessagePlayer } from "@/components/dashboard/community/voice-message-player";
import { cn } from "@/lib/utils";
import type { CommunityMessage, MessageReaction, MessageReactionEmoji } from "@/lib/data/community";

const LONG_PRESS_MS = 450;

/** Walks up from `el` to find the nearest ancestor that actually clips
 * overflow — the message list's overflow-y-auto pane — so the picker's
 * "is there room above?" check measures against the pane's own boundary,
 * not the browser viewport (which would still report plenty of room even
 * when the pane itself starts well below the top of the screen). */
function findScrollableAncestor(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}

export function MessageBubble({
  message,
  isOwn,
  senderName,
  senderAvatarUrl,
  reactions,
  currentUserId,
  onReport,
  onToggleReaction,
}: {
  message: CommunityMessage;
  isOwn: boolean;
  senderName: string;
  senderAvatarUrl: string | null;
  reactions: MessageReaction[];
  currentUserId: string;
  onReport: () => void;
  onToggleReaction: (emoji: MessageReactionEmoji) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPlacement, setPickerPlacement] = useState<"above" | "below">("above");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The picker's own height (~40px) plus a margin of safety — below this
  // much room above the bubble, it would render clipped by the message
  // list's overflow-y-auto (e.g. a message right at the top of the
  // visible scroll area), so open it below the bubble instead.
  const PICKER_CLEARANCE_PX = 60;

  const openPicker = () => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    const paneTop = findScrollableAncestor(wrapperRef.current)?.getBoundingClientRect().top ?? 0;
    const spaceAbove = rect ? rect.top - paneTop : Infinity;
    setPickerPlacement(spaceAbove < PICKER_CLEARANCE_PX ? "below" : "above");
    setPickerOpen(true);
  };

  const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(message.createdAt)
  );

  useEffect(() => {
    if (!pickerOpen) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [pickerOpen]);

  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = () => {
    clearLongPressTimer();
    longPressTimer.current = setTimeout(openPicker, LONG_PRESS_MS);
  };

  const summary = reactions.reduce<Map<MessageReactionEmoji, { count: number; reactedByMe: boolean }>>(
    (acc, reaction) => {
      const entry = acc.get(reaction.emoji) ?? { count: 0, reactedByMe: false };
      entry.count += 1;
      if (reaction.userId === currentUserId) entry.reactedByMe = true;
      acc.set(reaction.emoji, entry);
      return acc;
    },
    new Map()
  );

  const handlePick = (emoji: MessageReactionEmoji) => {
    onToggleReaction(emoji);
    setPickerOpen(false);
  };

  return (
    <div
      className={cn("group relative flex items-end gap-2.5", isOwn ? "flex-row-reverse" : "flex-row")}
      onTouchStart={handleTouchStart}
      onTouchEnd={clearLongPressTimer}
      onTouchMove={clearLongPressTimer}
    >
      {!isOwn && <UserAvatar name={senderName} avatarUrl={senderAvatarUrl} size={28} className="text-[10px]" />}
      <div
        ref={wrapperRef}
        className={cn("relative flex max-w-[80%] flex-col gap-1 sm:max-w-[65%]", isOwn ? "items-end" : "items-start")}
      >
        {pickerOpen && (
          <MessageReactionPicker align={isOwn ? "end" : "start"} placement={pickerPlacement} onPick={handlePick} />
        )}
        {!isOwn && <span className="px-1 text-[11px] font-semibold text-white/40">{senderName}</span>}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isOwn
              ? "rounded-br-md bg-brand-500 text-white"
              : "rounded-bl-md border border-white/10 bg-white/[0.05] text-white/85"
          )}
        >
          {message.imageUrl && (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="Agrandir la photo"
              className="mb-2 block w-full cursor-zoom-in"
            >
              <Image
                src={message.imageUrl}
                alt=""
                width={280}
                height={210}
                className="h-auto max-h-64 w-full rounded-xl object-cover"
                unoptimized
              />
            </button>
          )}
          {message.audioUrl && (
            <VoiceMessagePlayer
              src={message.audioUrl}
              durationSeconds={message.audioDurationSeconds}
              className={message.content ? "mb-2" : undefined}
            />
          )}
          {message.content && <p>{message.content}</p>}
        </div>

        {lightboxOpen && message.imageUrl && (
          <PhotoLightbox src={message.imageUrl} onClose={() => setLightboxOpen(false)} />
        )}

        {summary.size > 0 && (
          <div className={cn("flex flex-wrap items-center gap-1 px-1", isOwn ? "justify-end" : "justify-start")}>
            {Array.from(summary.entries()).map(([emoji, { count, reactedByMe }]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onToggleReaction(emoji)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] transition-colors",
                  reactedByMe
                    ? "border-brand-500/40 bg-brand-500/15 text-brand-300"
                    : "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20"
                )}
              >
                <span>{emoji}</span>
                {count > 1 && <span className="font-semibold">{count}</span>}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] text-white/25">{time}</span>
          <button
            type="button"
            onClick={() => (pickerOpen ? setPickerOpen(false) : openPicker())}
            aria-label="Réagir à ce message"
            className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <SmilePlus className="h-3 w-3 text-white/25 transition-colors hover:text-brand-400" strokeWidth={2} />
          </button>
          {!isOwn && (
            <button
              type="button"
              onClick={onReport}
              aria-label="Signaler ce message"
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Flag className="h-3 w-3 text-white/25 transition-colors hover:text-rose-400" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
