export type PricingPlan = {
  id: string;
  name: string;
  tagline: string;
  price: string;
  priceSuffix: string;
  afterOffer?: string;
  originalPrice?: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
  hasCountdown?: boolean;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "decouverte",
    name: "Offre découverte",
    tagline: "L'entrée idéale pour tester Polypips",
    price: "0,99 €",
    priceSuffix: "pendant 3 jours",
    afterOffer: "Puis 29,99 € / mois",
    features: [
      "Accès complet à toutes les fonctionnalités",
      "10 analyses IA par jour",
      "3 portefeuilles suivis par mois",
      "3 copy trading par semaine",
      "50 messages Coach IA par semaine",
      "3 sélections IA par jour",
    ],
    cta: "Débutez pour 0,99 €",
    hasCountdown: true,
    highlighted: true,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Pour analyser sérieusement, chaque jour",
    price: "29,99 €",
    priceSuffix: "/ mois",
    originalPrice: "49,99 €",
    features: [
      "10 analyses IA par jour",
      "3 portefeuilles suivis par mois",
      "3 copy trading par semaine",
      "50 messages Coach IA par semaine",
      "3 sélections IA par jour",
      "Statistiques avancées",
    ],
    cta: "Choisir Pro",
    badge: "Le plus populaire",
  },
  {
    id: "pro-plus",
    name: "Pro+",
    tagline: "Pour une utilisation intensive, sans limites",
    price: "79 €",
    priceSuffix: "/ mois",
    originalPrice: "145 €",
    features: [
      "Analyses IA illimitées",
      "Portefeuilles suivis illimités",
      "Copy trading illimité",
      "Messages Coach IA illimités",
      "Sélections IA illimitées",
      "Support prioritaire",
    ],
    cta: "Choisir Pro+",
  },
];
