"use client";

import { useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

// These auth cards put form fields close enough to the top that the fixed
// mobile chat launcher sits on top of them - hide it there rather than
// chase a magic-number offset that only ever fixes one page.
const HIDDEN_ON = ["/login", "/forgot-password"];

// The dashboard is a separate dark-themed app shell with its own mobile
// drawer sharing the same z-50 stacking context - the light-themed
// marketing launcher has no business appearing over it.
const HIDDEN_ON_PREFIXES = ["/dashboard"];

export function ChatButton() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (
    HIDDEN_ON.includes(pathname) ||
    HIDDEN_ON_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div className="w-72 animate-fade-up rounded-2xl border border-border bg-surface p-5 shadow-[0_20px_50px_-16px_rgba(23,11,13,0.2)]">
          <p className="font-display text-sm font-semibold text-ink">
            Besoin d&apos;aide ?
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-body">
            Notre équipe support est disponible pour répondre à vos questions
            sur Polypips.
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer le support" : "Ouvrir le support"}
        className={cn(
          "flex h-[60px] w-[60px] items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_14px_32px_-10px_rgba(229,35,35,0.5)] transition-transform duration-200 hover:scale-105 active:scale-95",
          !open && "animate-pulse-soft"
        )}
      >
        {open ? (
          <X className="h-[26px] w-[26px]" strokeWidth={2.25} />
        ) : (
          <MessageCircle className="h-[26px] w-[26px]" strokeWidth={2.25} />
        )}
      </button>
    </div>
  );
}
