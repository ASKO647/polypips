/**
 * User-referral attribution, mirroring lib/influencers/attribution.ts's
 * cookie shape and overwrite rule (visiting a /r/[slug] link is an
 * explicit, one-off action — it always overwrites whatever attribution was
 * stored before, same as the influencer cookie's rule, unlike the UTM
 * cookie's first-touch-only one).
 */
export type ReferralAttribution = {
  referrerUserId: string;
  /** The slug used for this click — stored verbatim on the resulting
   * user_referrals row as referral_code, avoiding a second DB lookup at
   * signup time to recover it. */
  slug: string;
};

export const REFERRAL_COOKIE_NAME = "polypips_referrer";
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function serializeReferralAttribution(attribution: ReferralAttribution): string {
  return encodeURIComponent(JSON.stringify(attribution));
}

function parseReferralAttributionValue(raw: string | null): ReferralAttribution | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.referrerUserId === "string" && typeof parsed?.slug === "string") {
      return { referrerUserId: parsed.referrerUserId, slug: parsed.slug };
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
