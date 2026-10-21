/** Structural data only — question/answer text lives in the
 * `FAQ.items` translation namespace, keyed by `id`. */
export const FAQ_ITEM_IDS = [
  "howAiWorks",
  "markets",
  "updateFrequency",
  "beginners",
  "cancelAnytime",
  "copyTrading",
] as const;

export const FAQ_CATEGORIES = ["all", "analysis", "subscription", "wallet"] as const;
export type FAQCategory = typeof FAQ_CATEGORIES[number];
export const FAQ_DETAILS = {
  howAiWorks: { category: "analysis", href: "/features", link: "features" },
  markets: { category: "analysis", href: "/features", link: "features" },
  updateFrequency: { category: "analysis", href: "/dashboard/markets", link: "markets" },
  beginners: { category: "analysis", href: "/features", link: "features" },
  cancelAnytime: { category: "subscription", href: "/dashboard/subscription", link: "subscription" },
  copyTrading: { category: "wallet", href: "/dashboard/copy-trading", link: "wallet" },
} as const;
