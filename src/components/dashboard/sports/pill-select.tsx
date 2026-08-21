"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Custom dropdown, not a native <select> — native option-list popups are
 * rendered by the OS/browser's own native widget layer on many platforms
 * (this is what produced the white-background-white-text bug: neither a
 * Tailwind class nor an inline style on <option> can reach that layer in
 * Firefox, Safari, or this headless Chromium build). A plain div-based
 * listbox is the only way to guarantee the dark theme actually renders.
 */
export function PillSelect({
  value,
  options,
  onChange,
  triggerClassName,
  panelClassName,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  triggerClassName?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "inline-flex items-center justify-between gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-white/70 transition-colors duration-150 hover:border-white/20 hover:text-white",
          triggerClassName
        )}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-150", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute left-0 top-[calc(100%+6px)] z-30 max-h-64 w-max min-w-full overflow-y-auto rounded-xl border border-white/10 bg-[#1c1011] p-1.5 shadow-xl",
            panelClassName
          )}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors duration-150",
                o.value === value
                  ? "bg-brand-500/15 text-brand-400"
                  : "text-white/70 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              {o.label}
              {o.value === value && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
