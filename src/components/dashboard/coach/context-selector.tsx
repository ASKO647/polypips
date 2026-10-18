"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { CONTEXT_SOURCES, type ContextSource } from "@/lib/data/coach";
import { cn } from "@/lib/utils";

/** "Ajouter un contexte" — one toggle per source, plus the removable
 * chips row shown above the conversation. Every change calls onChange
 * with the FULL next array; CoachFlow is responsible for persisting it
 * (sent as `enabledContext` on the next message, see coach-chat's
 * request contract). */
export function ContextSelector({
  enabled,
  onChange,
}: {
  enabled: ContextSource[];
  onChange: (next: ContextSource[]) => void;
}) {
  const t = useTranslations("Coach.ContextSelector");
  const [open, setOpen] = useState(false);

  const toggle = (source: ContextSource) => {
    const next = enabled.includes(source)
      ? enabled.filter((s) => s !== source)
      : [...enabled, source];
    onChange(next);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2">
        {enabled.map((source) => (
          <span
            key={source}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-300"
          >
            {t(`sources.${source}`)}
            <button
              type="button"
              onClick={() => toggle(source)}
              aria-label={t("removeAria", { source: t(`sources.${source}`) })}
              className="text-brand-300/60 transition-colors hover:text-brand-300"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("addButton")}
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-2xl border border-white/10 bg-[#140a0b] p-3 shadow-xl">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            {t("panelTitle")}
          </p>
          <div className="flex flex-col gap-1">
            {CONTEXT_SOURCES.map((source) => {
              const isOn = enabled.includes(source);
              return (
                <button
                  key={source}
                  type="button"
                  onClick={() => toggle(source)}
                  className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/[0.05]"
                >
                  {t(`sources.${source}`)}
                  <span
                    className={cn(
                      "flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-150",
                      isOn ? "bg-brand-500" : "bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "h-4 w-4 rounded-full bg-white transition-transform duration-150",
                        isOn && "translate-x-4"
                      )}
                    />
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 w-full rounded-xl border border-white/10 py-2 text-xs font-semibold text-white/60 transition-colors hover:text-white"
          >
            {t("doneButton")}
          </button>
        </div>
      )}
    </div>
  );
}
