/**
 * First-touch signup-attribution capture. Runs client-side: reads the
 * landing URL's UTM params (or falls back to a referrer heuristic) on a
 * visitor's first page of a session, and stores the result in a
 * first-party cookie so it survives navigation until signup — at which
 * point it's written once into signup_sources and never touched again
 * (see supabase/signup-sources.ts). AttributionCapture (the component
 * that calls writeStoredAttribution) only ever writes when no attribution
 * is stored yet, so a later organic/direct visit never overwrites the
 * campaign that actually brought the visitor here.
 *
 * This is not the same thing as the Vercel Analytics / analytics cookie
 * consent category: it doesn't track behavior or set a cross-session
 * identifier, only remembers "which link brought this visitor here" for
 * as long as it takes them to sign up (or the cookie's 30-day cap,
 * whichever is first) — closer to a signup-form field than to measurement
 * tooling. Not gated behind cookie consent for that reason.
 */
export type LandingAttribution = {
  source: string;
  medium: string | null;
  campaign: string | null;
  landingPath: string;
};

const ATTRIBUTION_COOKIE_NAME = "polypips_attribution";
const ATTRIBUTION_COOKIE_MAX_AGE_DAYS = 30;

const SEARCH_ENGINE_HOSTS = ["google.", "bing.", "duckduckgo.", "yahoo.", "ecosia.", "qwant."];

function classifyReferrer(
  referrer: string,
  ownHost: string
): { source: string; medium: string | null } {
  if (!referrer) return { source: "direct", medium: null };
  let referrerHost: string;
  try {
    referrerHost = new URL(referrer).hostname;
  } catch {
    return { source: "direct", medium: null };
  }
  if (referrerHost === ownHost) return { source: "direct", medium: null };
  if (SEARCH_ENGINE_HOSTS.some((host) => referrerHost.includes(host))) {
    return { source: "organic", medium: "search" };
  }
  return { source: referrerHost, medium: "referral" };
}

/** UTM params win when present; otherwise falls back to the referrer
 * heuristic above (organic search vs. another site vs. direct/no
 * referrer). */
export function resolveLandingAttribution(url: URL, referrer: string): LandingAttribution {
  const utmSource = url.searchParams.get("utm_source");
  if (utmSource) {
    return {
      source: utmSource,
      medium: url.searchParams.get("utm_medium"),
      campaign: url.searchParams.get("utm_campaign"),
      landingPath: url.pathname,
    };
  }
  const { source, medium } = classifyReferrer(referrer, url.hostname);
  return { source, medium, campaign: null, landingPath: url.pathname };
}

function readCookieRaw(cookieString: string, name: string): string | null {
  const match = cookieString.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function parseAttributionCookieValue(raw: string | null): LandingAttribution | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.source === "string" && typeof parsed?.landingPath === "string") {
      return {
        source: parsed.source,
        medium: typeof parsed.medium === "string" ? parsed.medium : null,
        campaign: typeof parsed.campaign === "string" ? parsed.campaign : null,
        landingPath: parsed.landingPath,
      };
    }
  } catch {
    // Malformed/tampered cookie — treat as "nothing captured".
  }
  return null;
}

/** Client components only (reads document.cookie). */
export function readStoredAttribution(): LandingAttribution | null {
  if (typeof document === "undefined") return null;
  return parseAttributionCookieValue(readCookieRaw(document.cookie, ATTRIBUTION_COOKIE_NAME));
}

/** Server-side equivalent for a route handler that only has the raw
 * `Cookie` request header (e.g. /auth/callback, which runs before any
 * client code and can't call document.cookie). */
export function readStoredAttributionFromHeader(cookieHeader: string): LandingAttribution | null {
  return parseAttributionCookieValue(readCookieRaw(cookieHeader, ATTRIBUTION_COOKIE_NAME));
}

export function writeStoredAttribution(attribution: LandingAttribution): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(attribution));
  const maxAge = ATTRIBUTION_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${ATTRIBUTION_COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
