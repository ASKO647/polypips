import Image from "next/image";
import type { Message } from "@/lib/data/coach";
import { cn } from "@/lib/utils";

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-end gap-2.5",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isUser && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/15">
          <Image
            src="/polypips-mark.png"
            alt=""
            width={290}
            height={322}
            className="h-4 w-auto"
          />
        </span>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[70%]",
          isUser
            ? "rounded-br-md bg-brand-500 text-white"
            : "rounded-bl-md border border-white/10 bg-white/[0.05] text-white/85"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
