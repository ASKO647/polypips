"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { FOMO_AXIOM_FAQ } from "@/lib/data/fomo-axiom-connect";
import { cn } from "@/lib/utils";

/** A small, self-contained accordion matching the dashboard's dark-mode
 * card language (border-white/10, bg-white/[0.03]) rather than importing
 * the marketing site's <Accordion> (components/ui/accordion.tsx), which
 * is styled for the landing page's light theme (border/surface/ink
 * tokens) and would look inconsistent dropped onto a dark dashboard page. */
export function FomoAxiomFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3">
      {FOMO_AXIOM_FAQ.map((item, i) => {
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
