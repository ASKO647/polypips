/**
 * User-to-user referral attribution ("Parrainage") — same shape and
 * cookie lifecycle as lib/influencers/attribution.ts, but simpler: a
 * referral is always a slug from a /r/[slug] link, never a typed code, so
 * there's no `referredVia` distinction to carry.
 */
export type ReferralAttribution = {
  slug: string;
};

export const REFERRAL_COOKIE_NAME = "polypips_referral";
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function serializeReferralAttribution(attribution: ReferralAttribution): string {
  return encodeURIComponent(JSON.stringify(attribution));
}

function parseReferralAttributionValue(raw: string | null): ReferralAttribution | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.slug === "string" && parsed.slug) {
      return { slug: parsed.slug };
    }
  } catch {
    // Malformed/tampered cookie — treat as "nothing captured".
  }
  return null;
}

function readCookieRaw(cookieString: string, name: string): string | null {
  const match = cookieString.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Client components only (reads document.cookie) — used by
 * signup-form.tsx's immediate-session branch. */
export function readReferralAttribution(): ReferralAttribution | null {
  if (typeof document === "undefined") return null;
  return parseReferralAttributionValue(readCookieRaw(document.cookie, REFERRAL_COOKIE_NAME));
}

/** Server-side equivalent for a route handler that only has the raw
 * `Cookie` request header (/auth/callback). */
export function readReferralAttributionFromHeader(cookieHeader: string): ReferralAttribution | null {
  return parseReferralAttributionValue(readCookieRaw(cookieHeader, REFERRAL_COOKIE_NAME));
}
