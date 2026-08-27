import { Brain, Sparkles, Repeat2, MessageCircleHeart, BarChart3, type LucideIcon } from "lucide-react";

export type FeatureDetail = {
  id: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
};

/** Full-page version of lib/data/features.ts's homepage grid — same five
 * capabilities, expanded into a paragraph + concrete bullet points for the
 * dedicated /features page. Kept factual and free of performance promises,
 * consistent with the "analyses informatives, pas un conseil financier"
 * framing already established in /terms. */
export const FEATURES_DETAIL: FeatureDetail[] = [
  {
    id: "ai-analysis",
    icon: Brain,
    eyebrow: "Analyse IA",
    title: "Polymarket et Sport, passés au crible par l'IA",
    description:
      "Déposez une capture d'écran ou collez le lien d'un marché Polymarket, ou décrivez un match sportif : l'IA analyse la question, les règles de résolution, les probabilités actuelles et les données disponibles pour vous proposer une décision argumentée.",
    points: [
      "Décision (YES/NO ou vainqueur), probabilité estimée et score d'opportunité",
      "Explication détaillée des facteurs pris en compte, en langage clair",
      "Fournie à titre informatif — la décision finale vous appartient toujours",
    ],
  },
  {
    id: "selected-markets",
    icon: Sparkles,
    eyebrow: "Marchés sélectionnés",
    title: "Une sélection resserrée, chaque jour",
    description:
      "Polypips scanne en continu les marchés Polymarket disponibles et vous présente une sélection resserrée, accompagnée du raisonnement de l'IA derrière chaque choix — pas une liste brute de tous les marchés existants.",
    points: [
      "Sélection actualisée plusieurs fois par jour",
      "Raisonnement affiché pour chaque marché retenu",
      "Filtrable pour se concentrer sur les catégories qui vous intéressent",
    ],
  },
  {
    id: "copy-trading",
    icon: Repeat2,
    eyebrow: "Copy Trading",
    title: "Testez une stratégie, en simulation",
    description:
      "Configurez une stratégie à partir des portefeuilles Smart Money suivis : budget maximum, niveau de risque et limites d'exposition sont entièrement paramétrables par vous.",
    points: [
      "Fonctionne exclusivement en simulation — aucun ordre réel n'est jamais transmis",
      "Budget, risque et exposition définis et modifiables à tout moment",
      "Historique des signaux et raisons associées, pour comprendre chaque suggestion",
    ],
  },
  {
    id: "ai-coach",
    icon: MessageCircleHeart,
    eyebrow: "Coach IA",
    title: "Un assistant pour poser vos questions",
    description:
      "Posez vos questions sur un marché, une analyse ou une stratégie à notre assistant conversationnel, qui s'appuie sur le contexte de votre compte pour répondre simplement, sans jargon inutile.",
    points: [
      "Réponses contextualisées à vos analyses et suivis",
      "Historique de conversation conservé d'une session à l'autre",
      "Disponible directement depuis le tableau de bord",
    ],
  },
  {
    id: "stats",
    icon: BarChart3,
    eyebrow: "Statistiques",
    title: "Suivez vos décisions dans le temps",
    description:
      "Retrouvez votre activité, la répartition de vos décisions par catégorie et l'évolution de votre performance simulée, pour identifier ce qui fonctionne pour vous.",
    points: [
      "Répartition des décisions par catégorie de marché",
      "Évolution de la performance simulée dans le temps",
      "Historique complet de vos analyses passées",
    ],
  },
];
