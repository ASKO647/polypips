"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import styles from "./coach-workspace.module.css";

export function TypingIndicator() {
  const t = useTranslations("Coach.TypingIndicator");

  return (
    <div className={styles.messageRow}>
      <span className={styles.messageAvatar}>
        <Image
          src="/polypips-mark.png"
          alt=""
          width={290}
          height={322}
          className={styles.messageLogo}
        />
      </span>
      <div
        className={styles.typingBubble}
        role="status"
        aria-label={t("ariaLabel")}
      >
        <span
          className={styles.typingPoint}
          style={{ animationDelay: "0ms" }}
        />
        <span
          className={styles.typingPoint}
          style={{ animationDelay: "150ms" }}
        />
        <span
          className={styles.typingPoint}
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
