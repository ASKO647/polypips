const SLUG_LENGTH = 10;

/**
 * Random per-user referral slug — lowercase hex only (matches
 * user_referral_links' format constraint), so a slice of crypto.randomUUID()
 * with the dashes stripped is sufficient. Unlike influencer tracking_slug
 * (typed by the owner, slugified from a name), there's no human input to
 * derive this from — every user gets one automatically — so it's generated,
 * not slugified, with the caller (ensureReferralSlug) retrying on the rare
 * unique-constraint collision.
 */
export function generateReferralSlug(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, SLUG_LENGTH);
}
