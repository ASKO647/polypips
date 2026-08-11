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
};

export const FEATURES: Feature[] = [
  {
    id: "ai-analysis",
    icon: Brain,
    title: "Analyse IA profonde",
    description:
      "L'IA analyse chaque marché en profondeur et vous dit quoi parier et pourquoi.",
  },
  {
    id: "smart-money",
    icon: Radar,
    title: "Suivi Smart Money",
    description:
      "Suivez en temps réel les achats des meilleurs portefeuilles de Polymarket.",
  },
  {
    id: "copy-trading",
    icon: Repeat2,
    title: "Copy Trading",
    description:
      "Laissez notre IA parier pour vous, automatiquement, sur les meilleurs marchés.",
  },
  {
    id: "ai-selected",
    icon: Sparkles,
    title: "Paris sélectionnés",
    description:
      "Découvrez chaque jour les meilleurs paris sélectionnés par notre IA.",
  },
  {
    id: "ai-coach",
    icon: MessageCircleHeart,
    title: "Coach IA personnel",
    description:
      "Posez toutes vos questions et obtenez des réponses claires de notre IA.",
  },
  {
    id: "stats",
    icon: BarChart3,
    title: "Statistiques avancées",
    description:
      "Suivez vos performances, vos gains et toutes vos statistiques clés.",
  },
];
