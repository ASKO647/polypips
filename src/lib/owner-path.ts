/**
 * Single source of truth for the owner console's URL segment — a fixed,
 * non-guessable path (not a folder name templated from an env var: App
 * Router routes are resolved at build time, so real "change the URL
 * without a redeploy" isn't achievable without a proxy-level rewrite that
 * would need a redeploy of its own to take effect anyway). The real
 * protection is the server-side owner+AAL2 check in
 * src/app/ctrl-9f4k2q7x/layout.tsx, not this string — treat renaming it as
 * a housekeeping convenience, not a security control.
 */
export const OWNER_BASE_PATH = "/ctrl-9f4k2q7x";
