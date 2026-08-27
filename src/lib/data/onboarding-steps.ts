import { UserPlus, Compass, Sparkles, LineChart, type LucideIcon } from "lucide-react";

export type OnboardingStep = {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

/** The account-level journey shown on /how-it-works — distinct from
 * HOW_IT_WORKS_STEPS (lib/data/how-it-works.ts), which walks through a
 * single Analyse IA request rather than the full onboarding path. */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    number: "01",
    icon: UserPlus,
    title: "Créez votre compte",
    description:
      "Inscrivez-vous en quelques secondes avec votre email ou votre compte Google, puis choisissez votre offre.",
  },
  {
    number: "02",
    icon: Compass,
    title: "Choisissez vos marchés et vos suivis",
    description:
      "Sélectionnez les marchés Polymarket ou les matchs sportifs qui vous intéressent, et suivez les portefeuilles Smart Money de votre choix.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Recevez vos analyses IA",
    description:
      "Obtenez une décision argumentée, une probabilité estimée et une explication détaillée pour chaque marché ou match analysé.",
  },
  {
    number: "04",
    icon: LineChart,
    title: "Suivez vos performances",
    description:
      "Retrouvez l'historique de vos décisions et l'évolution de votre performance simulée dans l'onglet Statistiques.",
  },
];
