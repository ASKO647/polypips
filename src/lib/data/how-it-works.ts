import {
  UploadCloud,
  BrainCircuit,
  Target,
  LineChart,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type HowItWorksStep = {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    number: "01",
    icon: UploadCloud,
    title: "Importez un marché",
    description:
      "Déposez une capture d'écran ou collez le lien d'un marché Polymarket.",
  },
  {
    number: "02",
    icon: BrainCircuit,
    title: "L'IA analyse tout",
    description:
      "Question, règles, probabilités, données et sources externes sont passées au crible.",
  },
  {
    number: "03",
    icon: Target,
    title: "Obtenez la décision",
    description:
      "YES ou NO, probabilité, edge, score d'opportunité et explication détaillée.",
  },
  {
    number: "04",
    icon: LineChart,
    title: "Suivez les meilleures opportunités",
    description:
      "Marchés sélectionnés par l'IA et portefeuilles Smart Money, en continu.",
  },
  {
    number: "05",
    icon: Zap,
    title: "Prenez vos décisions",
    description:
      "Agissez avec un avantage informationnel clair, à votre rythme.",
  },
];
