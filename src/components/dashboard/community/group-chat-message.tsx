"use client";

import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { avatarToneFor, initialsFor, type GroupMessage } from "@/lib/data/community";
import { formatRelativeTime } from "@/lib/supabase/analyses";
import { createClient } from "@/lib/supabase/client";
import { getSignedImageUrl } from "@/lib/supabase/groups-client";
import { cn } from "@/lib/utils";

export function GroupChatMessage({
  message,
  isOwn,
  reported,
  onReport,
}: {
  message: GroupMessage;
  isOwn: boolean;
  reported: boolean;
  onReport: (messageId: string) => void;
}) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (message.imageUrl) {
      const supabase = createClient();
      getSignedImageUrl(supabase, message.imageUrl).then((url) => {
        if (!cancelled) setImageSrc(url);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [message.imageUrl]);

  return (
    <div className={cn("flex items-end gap-2.5", isOwn ? "flex-row-reverse" : "flex-row")}>
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
          avatarToneFor(message.userId)
        )}
      >
        {initialsFor(message.displayName)}
      </span>

      <div className={cn("flex max-w-[80%] flex-col gap-1 sm:max-w-[70%]", isOwn && "items-end")}>
        <span className="px-1 text-[11px] font-medium text-white/40">
          {isOwn ? "Vous" : message.displayName} · {formatRelativeTime(message.createdAt)}
        </span>

        <div className="group/msg relative">
          <div
            className={cn(
              "overflow-hidden rounded-2xl text-sm leading-relaxed",
              isOwn
                ? "rounded-br-md bg-brand-500 text-white"
                : "rounded-bl-md border border-white/10 bg-white/[0.05] text-white/85"
            )}
          >
            {imageSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt="Pièce jointe"
                className="block max-h-72 w-full object-cover"
              />
            )}
            {message.content && (
              <p className={cn("px-4 py-2.5", imageSrc && "pt-2")}>{message.content}</p>
            )}
          </div>

          {!isOwn && (
            <button
              type="button"
              onClick={() => onReport(message.id)}
              disabled={reported}
              aria-label={reported ? "Message signalé" : "Signaler ce message"}
              title={reported ? "Message signalé" : "Signaler ce message"}
              className={cn(
                "absolute -top-2 flex h-6 w-6 items-center justify-center rounded-full border text-[10px] opacity-0 transition-opacity duration-150 group-hover/msg:opacity-100",
                isOwn ? "-left-2" : "-right-2",
                reported
                  ? "border-rose-400/30 bg-rose-500/15 text-rose-400 opacity-100"
                  : "border-white/10 bg-[#160b0c] text-white/40 hover:text-white"
              )}
            >
              <Flag className="h-3 w-3" strokeWidth={2.25} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
