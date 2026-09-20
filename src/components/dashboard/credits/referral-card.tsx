"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// window.location.origin never changes during a page view, so the
// "subscribe" side is a no-op — this is purely here to read a browser-only
// value safely: getServerSnapshot returns null during SSR (and on the
// client's very first render, before hydration), so the server-rendered
// HTML and the initial client render always agree, no useEffect required.
function subscribeNoop() {
  return () => {};
}
function getOrigin(): string | null {
  return window.location.origin;
}
function getServerOrigin(): string | null {
  return null;
}

/** Shared "Parrainez un ami" highlight — reused as-is on /dashboard/credits
 * and in the Profil pricing section, so the referral pitch and copy-link
 * behavior never drift between the two places it appears. */
export function ReferralCard({ referralSlug }: { referralSlug: string | null }) {
  const t = useTranslations("Credits.Referral");
  const [copied, setCopied] = useState(false);
  const origin = useSyncExternalStore(subscribeNoop, getOrigin, getServerOrigin);
  const link = referralSlug && origin ? `${origin}/r/${referralSlug}` : null;

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — the link is
      // still selectable/readable in the input, so this is a soft failure.
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 rounded-2xl border border-brand-400/30 bg-brand-500/[0.05] p-6">
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-400">
          <Users className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-base font-bold text-dash-text">{t("title")}</h3>
          <p className="mt-1 text-sm text-dash-text-secondary">{t("description")}</p>
        </div>
      </div>

      {link ? (
        // Always stacked and full-width, never a fixed pixel width — this
        // component is embedded both on the full-width /dashboard/credits
        // page and inside Profil's much narrower right-column card, so it
        // must size itself to whatever container it's given rather than
        // assuming a viewport-width breakpoint (sm:) has room to spare.
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="h-10 w-full min-w-0 flex-1 rounded-full border border-dash-border bg-dash-surface px-4 text-xs text-dash-text-secondary outline-none"
          />
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-colors",
              copied
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-brand-500 text-white hover:bg-brand-600"
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t("copiedLabel") : t("copyButton")}
          </button>
        </div>
      ) : (
        <p className="text-xs text-dash-text-quaternary">{t("unavailable")}</p>
      )}
    </div>
  );
}
