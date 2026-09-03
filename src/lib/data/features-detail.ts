import { Brain, Sparkles, Repeat2, MessageCircleHeart, BarChart3, type LucideIcon } from "lucide-react";

export type FeatureDetailId = "ai-analysis" | "selected-markets" | "copy-trading" | "ai-coach" | "stats";

export type FeatureDetailMeta = {
  id: FeatureDetailId;
  key: string;
  icon: LucideIcon;
};

/** Full-page version of lib/data/features.ts's homepage grid — same five
 * capabilities, expanded into a paragraph + concrete bullet points for the
 * dedicated /features page. Kept factual and free of performance promises,
 * consistent with the "analyses informatives, pas un conseil financier"
 * framing already established in /terms.
 *
 * Display copy (eyebrow/title/description/points) lives in
 * `Pages.Features.items` (messages/{locale}/pages.json), never as
 * hardcoded strings here — this file only holds the ordered,
 * language-neutral id/icon metadata. `key` is the camelCase segment used
 * under `Pages.Features.items` for each entry. Call getFeaturesDetail(t)
 * with a translator scoped to "Pages.Features" to get the locale-aware
 * list at render time. */
export const FEATURES_DETAIL_META: FeatureDetailMeta[] = [
  { id: "ai-analysis", key: "aiAnalysis", icon: Brain },
  { id: "selected-markets", key: "selectedMarkets", icon: Sparkles },
  { id: "copy-trading", key: "copyTrading", icon: Repeat2 },
  { id: "ai-coach", key: "aiCoach", icon: MessageCircleHeart },
  { id: "stats", key: "stats", icon: BarChart3 },
];

export type FeatureDetail = FeatureDetailMeta & {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
};

type FeaturesDetailTranslator = {
  (key: string): string;
  raw: (key: string) => unknown;
};

/** Builds the locale-aware feature detail list — call with a translator
 * scoped to "Pages.Features" so every entry's copy renders in the current
 * locale. Never import a static entry array directly; call this at render
 * time in the features page. */
export function getFeaturesDetail(t: FeaturesDetailTranslator): FeatureDetail[] {
  return FEATURES_DETAIL_META.map((meta) => ({
    ...meta,
    eyebrow: t(`items.${meta.key}.eyebrow`),
    title: t(`items.${meta.key}.title`),
    description: t(`items.${meta.key}.description`),
    points: t.raw(`items.${meta.key}.points`) as string[],
  }));
}
