import { UserPlus, Compass, Sparkles, LineChart, type LucideIcon } from "lucide-react";

export type OnboardingStepMeta = {
  number: string;
  key: string;
  icon: LucideIcon;
};

/** The account-level journey shown on /how-it-works — distinct from
 * HOW_IT_WORKS_STEPS (lib/data/how-it-works.ts), which walks through a
 * single Analyse IA request rather than the full onboarding path.
 *
 * Display copy (title/description) lives in `Pages.HowItWorks.steps`
 * (messages/{locale}/pages.json), never as hardcoded strings here — this
 * file only holds the ordered, language-neutral number/icon metadata.
 * `key` is the camelCase segment used under `Pages.HowItWorks.steps` for
 * each entry. Call getOnboardingSteps(t) with a translator scoped to
 * "Pages.HowItWorks" to get the locale-aware list at render time. */
export const ONBOARDING_STEPS_META: OnboardingStepMeta[] = [
  { number: "01", key: "create", icon: UserPlus },
  { number: "02", key: "choose", icon: Compass },
  { number: "03", key: "receive", icon: Sparkles },
  { number: "04", key: "track", icon: LineChart },
];

export type OnboardingStep = OnboardingStepMeta & {
  title: string;
  description: string;
};

type OnboardingTranslator = {
  (key: string): string;
};

/** Builds the locale-aware onboarding step list — call with a translator
 * scoped to "Pages.HowItWorks" so every step's copy renders in the current
 * locale. Never import a static step array directly; call this at render
 * time in the how-it-works page. */
export function getOnboardingSteps(t: OnboardingTranslator): OnboardingStep[] {
  return ONBOARDING_STEPS_META.map((meta) => ({
    ...meta,
    title: t(`steps.${meta.key}.title`),
    description: t(`steps.${meta.key}.description`),
  }));
}
