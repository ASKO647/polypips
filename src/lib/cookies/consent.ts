/**
 * Client-only cookie-consent storage. The essential category is never
 * stored as a toggle — it's implied "true" the moment any consent record
 * exists, since it covers cookies the site can't function without
 * (session/auth, CSRF, the consent choice itself). Only the opt-in
 * categories are persisted.
 */
export type CookieConsent = {
  essential: true;
  analytics: boolean;
};

const CONSENT_COOKIE_NAME = "polypips_cookie_consent";
const CONSENT_COOKIE_MAX_AGE_DAYS = 180;

export function readStoredConsent(): CookieConsent | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CONSENT_COOKIE_NAME}=([^;]*)`)
  );
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    if (typeof parsed?.analytics === "boolean") {
      return { essential: true, analytics: parsed.analytics };
    }
  } catch {
    // Malformed/tampered cookie — treat as "no choice yet" so the banner
    // asks again rather than silently trusting garbage input.
  }
  return null;
}

export function writeStoredConsent(analytics: boolean): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify({ analytics }));
  const maxAge = CONSENT_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
