"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
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
          "flex h-13 w-13 items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_14px_32px_-10px_var(--color-brand-500)] transition-transform duration-200 hover:scale-105 active:scale-95"
        )}
      >
        {open ? (
          <X className="h-5 w-5" strokeWidth={2.25} />
        ) : (
          <MessageCircle className="h-5 w-5" strokeWidth={2.25} />
        )}
      </button>
    </div>
  );
}
