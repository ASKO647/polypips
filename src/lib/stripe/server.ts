import Stripe from "stripe";

let cached: Stripe | null = null;

/** Codepoints that are invisible/near-invisible in a plain-text editor but
 * make Node's http client reject the resulting "Bearer <key>" Authorization
 * header with ERR_INVALID_CHAR — the class of paste artifact a
 * character-by-character visual check can't catch. Logged only as a
 * boolean + the codepoint itself, never alongside enough of the string to
 * reconstruct the key. */
function isSuspiciousEdgeChar(char: string | undefined): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  // Control chars (incl. \n, \r, \t), space, and stray quotes.
  return code <= 0x20 || char === '"' || char === "'";
}

/**
 * Lazily constructed so the module can be imported (and route files
 * collected) at build time without STRIPE_SECRET_KEY being set — the key is
 * only actually required once a request comes in and calls this.
 *
 * apiVersion is intentionally left unset — the SDK defaults to the version
 * pinned to the installed `stripe` package, which is the version-safe
 * choice recommended by Stripe over hardcoding a date string that goes
 * stale as the SDK is upgraded.
 */
export function getStripe(): Stripe {
  if (!cached) {
    const raw = process.env.STRIPE_SECRET_KEY ?? "";
    const key = raw.trim();

    // TEMPORARY diagnostic for the ERR_INVALID_CHAR investigation — never
    // logs the key itself, only shape metadata. Remove once confirmed.
    if (raw.length !== key.length || isSuspiciousEdgeChar(raw[0]) || isSuspiciousEdgeChar(raw[raw.length - 1])) {
      console.warn("[stripe] STRIPE_SECRET_KEY has leading/trailing whitespace or control characters", {
        rawLength: raw.length,
        trimmedLength: key.length,
        firstCharCode: raw.length ? raw.charCodeAt(0) : null,
        lastCharCode: raw.length ? raw.charCodeAt(raw.length - 1) : null,
      });
    }

    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set.");
    }

    cached = new Stripe(key);
  }
  return cached;
}
