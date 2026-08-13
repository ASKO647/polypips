import Stripe from "stripe";

let cached: Stripe | null = null;

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
    cached = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return cached;
}
