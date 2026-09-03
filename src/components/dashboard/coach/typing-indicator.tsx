"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

export function TypingIndicator() {
  const t = useTranslations("Coach.TypingIndicator");

  return (
    <div className="flex items-end gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/15">
        <Image
          src="/polypips-mark.png"
          alt=""
          width={290}
          height={322}
          className="h-4 w-auto"
        />
      </span>
      <div
        className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.05] px-4 py-3.5"
        role="status"
        aria-label={t("ariaLabel")}
      >
        <span
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
