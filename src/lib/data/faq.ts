export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Comment fonctionne l'analyse IA ?",
    answer:
      "Vous déposez une capture d'écran d'un marché Polymarket ou collez son lien. Polypips analyse la question, les règles de résolution, les probabilités actuelles et les sources externes pertinentes, puis vous propose une décision (YES ou NO), une probabilité estimée, l'edge, un score d'opportunité et une explication détaillée.",
  },
  {
    question: "À quelle fréquence les analyses sont-elles mises à jour ?",
    answer:
      "Les marchés évoluent en continu : nos analyses intègrent les dernières données disponibles au moment de la demande, et les marchés sélectionnés par l'IA sont actualisés plusieurs fois par jour.",
  },
  {
    question: "Puis-je annuler à tout moment ?",
    answer:
      "Oui. Votre abonnement se gère en un clic depuis votre compte, sans engagement ni durée minimale.",
  },
  {
    question: "L'IA est-elle adaptée aux débutants ?",
    answer:
      "Oui. Chaque analyse est expliquée en langage clair : facteurs favorables, risques, et ce qui pourrait faire changer la décision. Le Coach IA est là pour répondre à toutes vos questions.",
  },
  {
    question: "Quels marchés sont couverts ?",
    answer:
      "La V1 de Polypips est principalement orientée vers les marchés Polymarket. D'autres plateformes de prediction markets seront intégrées progressivement.",
  },
  {
    question: "Polypips touche-t-il à mon portefeuille ?",
    answer:
      "Non, sauf si vous activez explicitement le Copy Trading et autorisez une stratégie automatisée avec des paramètres de risque que vous définissez vous-même. Vous gardez le contrôle à tout moment.",
  },
  {
    question: "Comment fonctionne le Copy Trading ?",
    answer:
      "Vous choisissez une stratégie, puis définissez vos propres paramètres de risque (montant maximum par position, exposition maximale, nombre de positions). Aucun rendement n'est garanti : il s'agit d'une automatisation de vos règles, pas d'une promesse de gain.",
  },
];
