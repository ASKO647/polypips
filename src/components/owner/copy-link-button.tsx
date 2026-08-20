"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

/** Copies `value` to the clipboard and flashes a "Copié !" confirmation
 * for 2s — used for the influencer's full /i/[slug] link. */
export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("[copy-link-button] clipboard write failed", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/15"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-400" /> Copié !
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" /> Copier
        </>
      )}
    </button>
  );
}
