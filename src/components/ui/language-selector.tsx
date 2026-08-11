"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "FR", label: "Français" },
  { code: "EN", label: "English" },
];

export function LanguageSelector({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState(LANGUAGES[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-strong bg-surface-muted px-3 text-sm font-semibold text-ink transition-colors hover:border-brand-200 hover:bg-brand-50/60"
      >
        <Globe className="h-4 w-4 text-body-soft" strokeWidth={2} />
        {lang.code}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-body-soft transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-40 overflow-hidden rounded-xl border border-border bg-surface py-1.5 shadow-[0_16px_40px_-12px_rgba(23,11,13,0.2)]"
        >
          {LANGUAGES.map((option) => (
            <button
              key={option.code}
              type="button"
              role="option"
              aria-selected={option.code === lang.code}
              onClick={() => {
                setLang(option);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm text-ink transition-colors hover:bg-brand-50"
            >
              <span>
                <span className="font-semibold">{option.code}</span>{" "}
                <span className="text-body-soft">{option.label}</span>
              </span>
              {option.code === lang.code && (
                <Check className="h-4 w-4 text-brand-600" strokeWidth={2.5} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
