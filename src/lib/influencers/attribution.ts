/**
 * Influencer-referral attribution, mirroring the shape of
 * lib/attribution/capture.ts (the UTM one) but with a deliberately
 * different overwrite rule: visiting an /i/[slug] link or typing a promo
 * code are both explicit, one-off referral actions — not a passive page
 * load — so either one always overwrites whatever attribution was stored
 * before, instead of the UTM cookie's first-touch-only rule. Last
 * deliberate action wins.
 */
export type InfluencerAttribution = {
  influencerId: string;
  referredVia: "code" | "link";
};

export const INFLUENCER_COOKIE_NAME = "polypips_influencer";
export const INFLUENCER_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function serializeInfluencerAttribution(attribution: InfluencerAttribution): string {
  return encodeURIComponent(JSON.stringify(attribution));
}

function parseInfluencerAttributionValue(raw: string | null): InfluencerAttribution | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.influencerId === "string" &&
      (parsed.referredVia === "code" || parsed.referredVia === "link")
    ) {
      return { influencerId: parsed.influencerId, referredVia: parsed.referredVia };
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
export function readInfluencerAttribution(): InfluencerAttribution | null {
  if (typeof document === "undefined") return null;
  return parseInfluencerAttributionValue(readCookieRaw(document.cookie, INFLUENCER_COOKIE_NAME));
}

/** Server-side equivalent for a route handler that only has the raw
 * `Cookie` request header (/auth/callback). */
export function readInfluencerAttributionFromHeader(
  cookieHeader: string
): InfluencerAttribution | null {
  return parseInfluencerAttributionValue(readCookieRaw(cookieHeader, INFLUENCER_COOKIE_NAME));
}
