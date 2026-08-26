"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { HOW_IT_WORKS_FAQ } from "@/lib/data/signal-how-it-works";
import { cn } from "@/lib/utils";

/** Same small self-contained accordion pattern used elsewhere in the
 * dashboard's dark theme (not the marketing site's light-themed
 * <Accordion>, styled for a different token system). */
export function HowItWorksFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3">
      {HOW_IT_WORKS_FAQ.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.question} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-bold text-white">{item.question}</span>
              <Plus
                className={cn(
                  "h-4 w-4 shrink-0 text-brand-400 transition-transform duration-200",
                  open && "rotate-45"
                )}
                strokeWidth={2.5}
              />
            </button>
            {open && (
              <div className="px-5 pb-4 text-sm leading-relaxed text-white/60">{item.answer}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
