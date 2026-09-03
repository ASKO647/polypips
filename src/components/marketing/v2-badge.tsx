"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** The "NOUVEAU · V2.0" pill — shared by the Hero (top of the page) and
 * V2Announcement (right before Pricing) so both places announce the same
 * release with the exact same component, never a re-typed lookalike. */
export function V2Badge({ className }: { className?: string }) {
  const t = useTranslations("V2Badge");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand-600",
        className
      )}
    >
      <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
      {t("label")}
    </span>
  );
}
