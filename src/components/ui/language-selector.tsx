"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LanguageSelector({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("LanguageSelector");

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
    };
  }, [open]);

  function switchLocale(next: (typeof routing.locales)[number]) {
    setOpen(false);
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3.5 text-sm font-semibold text-ink transition-colors hover:border-brand-200 hover:bg-brand-50/60"
      >
        <Globe className="h-4 w-4 text-body-soft" strokeWidth={2} />
        {locale.toUpperCase()}
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
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-40 overflow-hidden rounded-xl border border-border bg-surface py-1.5 shadow-[0_16px_40px_-12px_rgba(23,11,13,0.2)]"
        >
          {routing.locales.map((code) => (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={code === locale}
              onClick={() => switchLocale(code)}
              className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm text-ink transition-colors hover:bg-brand-50"
            >
              <span>
                <span className="font-semibold">{code.toUpperCase()}</span>{" "}
                <span className="text-body-soft">{t(code)}</span>
              </span>
              {code === locale && (
                <Check className="h-4 w-4 text-brand-600" strokeWidth={2.5} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
