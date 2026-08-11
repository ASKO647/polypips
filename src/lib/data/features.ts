import {
  Brain,
  Radar,
  Repeat2,
  Sparkles,
  MessageCircleHeart,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export type Feature = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  metric?: { label: string; value: string };
  size: "lg" | "md";
};

export const FEATURES: Feature[] = [
  {
    id: "ai-analysis",
    icon: Brain,
    title: "Analyse IA profonde",
    description:
      "Question, règles de résolution, données de marché et sources externes : l'IA décortique chaque marché et explique sa décision, YES ou NO.",
    metric: { label: "Opportunity Score", value: "87/100" },
    size: "lg",
  },
  {
    id: "smart-money",
    icon: Radar,
    title: "Suivi Smart Money",
    description:
      "Repérez les portefeuilles qui performent et suivez leurs mouvements en temps réel.",
    size: "md",
  },
  {
    id: "copy-trading",
    icon: Repeat2,
    title: "Copy Trading",
    description:
      "Définissez vos règles de risque et laissez une stratégie s'exécuter pour vous.",
    size: "md",
  },
  {
    id: "ai-selected",
    icon: Sparkles,
    title: "Paris sélectionnés par l'IA",
    description:
      "Chaque jour, une sélection de marchés à fort potentiel, triés par edge et confiance.",
    metric: { label: "Edge moyen", value: "+14,2%" },
    size: "md",
  },
  {
    id: "ai-coach",
    icon: MessageCircleHeart,
    title: "Coach IA personnel",
    description:
      "Posez vos questions, comparez des marchés, comprenez chaque analyse en détail.",
    size: "md",
  },
  {
    id: "stats",
    icon: BarChart3,
    title: "Statistiques avancées",
    description:
      "Précision historique, edge moyen, performance par catégorie : suivez votre progression.",
    size: "lg",
  },
];
