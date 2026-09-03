export type SupportFaqItemMeta = {
  key: string;
};

/** Display copy (question/answer) lives in `Pages.Support.items`
 * (messages/{locale}/pages.json), never as hardcoded strings here — this
 * file only holds the ordered, language-neutral item keys. Call
 * getSupportFaqItems(t) with a translator scoped to "Pages.Support" to get
 * the locale-aware FAQ list at render time. */
export const SUPPORT_FAQ_ITEMS_META: SupportFaqItemMeta[] = [
  { key: "discoveryOffer" },
  { key: "cancelSubscription" },
  { key: "paymentMethods" },
  { key: "connectWallet" },
  { key: "howAiWorks" },
  { key: "copyTradingReal" },
  { key: "financialAdvice" },
  { key: "forgotPassword" },
  { key: "deleteAccount" },
  { key: "contactSupport" },
];

export type SupportFaqItem = SupportFaqItemMeta & {
  question: string;
  answer: string;
};

type SupportFaqTranslator = {
  (key: string): string;
};

/** Builds the locale-aware FAQ item list — call with a translator scoped
 * to "Pages.Support" so every item's copy renders in the current locale.
 * Never import a static item array directly; call this at render time in
 * the support page. */
export function getSupportFaqItems(t: SupportFaqTranslator): SupportFaqItem[] {
  return SUPPORT_FAQ_ITEMS_META.map((meta) => ({
    ...meta,
    question: t(`items.${meta.key}.question`),
    answer: t(`items.${meta.key}.answer`),
  }));
}
