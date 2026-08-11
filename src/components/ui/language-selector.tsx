"use client";

import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function LanguageSelector({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border border-border-strong bg-surface-muted px-3 text-sm font-semibold text-ink transition-colors hover:border-brand-200 hover:bg-brand-50/60",
        className
      )}
    >
      <Globe className="h-4 w-4 text-body-soft" strokeWidth={2} />
      FR
    </button>
  );
}
