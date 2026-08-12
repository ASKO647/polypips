/**
 * Mocked history/stats are only meaningful for demo or preview screenshots.
 * A real account starts with zero activity, so production must default to
 * empty states unless this flag is explicitly turned on for a demo deploy.
 */
export const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
