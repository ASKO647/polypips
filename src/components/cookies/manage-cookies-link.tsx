"use client";

import { useCookieConsent } from "@/providers/cookie-consent-provider";

/** Not a real route — re-opens the same consent banner used on first
 * visit, pre-filled with the current choice, so a visitor can change
 * their mind at any time (RGPD requires this to be as easy as the
 * original choice). */
export function ManageCookiesLink({ className }: { className?: string }) {
  const { openPreferences } = useCookieConsent();
  return (
    <button type="button" onClick={openPreferences} className={className}>
      Gérer mes cookies
    </button>
  );
}
