import Image from "next/image";
import type { Message } from "@/lib/data/coach";
import { cn } from "@/lib/utils";
import styles from "./coach-workspace.module.css";

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        styles.messageRow,
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isUser && (
        <span className={styles.messageAvatar}>
          <Image
            src="/polypips-mark.png"
            alt=""
            width={290}
            height={322}
            className={styles.messageLogo}
          />
        </span>
      )}
      <div
        className={cn(
          styles.messageBubble,
          isUser
            ? styles.userBubble
            : styles.assistantBubble
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
