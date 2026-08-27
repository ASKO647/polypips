import Image from "next/image";
import { Flag } from "lucide-react";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { cn } from "@/lib/utils";
import type { CommunityMessage } from "@/lib/data/community";

export function MessageBubble({
  message,
  isOwn,
  senderName,
  senderAvatarUrl,
  onReport,
}: {
  message: CommunityMessage;
  isOwn: boolean;
  senderName: string;
  senderAvatarUrl: string | null;
  onReport: () => void;
}) {
  const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(message.createdAt)
  );

  return (
    <div className={cn("group flex items-end gap-2.5", isOwn ? "flex-row-reverse" : "flex-row")}>
      {!isOwn && <UserAvatar name={senderName} avatarUrl={senderAvatarUrl} size={28} className="text-[10px]" />}
      <div className={cn("flex max-w-[80%] flex-col gap-1 sm:max-w-[65%]", isOwn ? "items-end" : "items-start")}>
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
            <Image
              src={message.imageUrl}
              alt=""
              width={280}
              height={210}
              className="mb-2 h-auto max-h-64 w-full rounded-xl object-cover"
              unoptimized
            />
          )}
          {message.content && <p>{message.content}</p>}
        </div>
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] text-white/25">{time}</span>
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
