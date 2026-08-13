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

/** Derives a plan's daily analysis cap from its own feature list, so the
 * dashboard never hardcodes a number that could drift from the pricing page.
 * Returns null when the plan has no such line (i.e. unlimited analyses). */
export function getDailyAnalysisLimit(plan: PricingPlan): number | null {
  for (const feature of plan.features) {
    const match = feature.match(/^(\d+)\s+analyses?\s+IA\s+par\s+jour$/i);
    if (match) return Number(match[1]);
  }
  return null;
}

/** Same idea as getDailyAnalysisLimit, for the Coach IA weekly message cap.
 * Returns null when the plan has no such line (i.e. unlimited messages). */
export function getWeeklyCoachMessageLimit(plan: PricingPlan): number | null {
  for (const feature of plan.features) {
    const match = feature.match(/^(\d+)\s+messages?\s+Coach\s+IA\s+par\s+semaine$/i);
    if (match) return Number(match[1]);
  }
  return null;
}

/**
 * "3 portefeuilles suivis par mois" reads as a monthly rate on its face,
 * but a followed wallet is a standing thing you keep or drop (like a
 * watchlist), not a one-shot action like an analysis or a message — so
 * this is enforced as a concurrent cap (at most N wallets followed at
 * once), matching how the rest of the follow/unfollow UI behaves. Returns
 * null when unlimited.
 */
export function getMaxTrackedWallets(plan: PricingPlan): number | null {
  for (const feature of plan.features) {
    const match = feature.match(/^(\d+)\s+portefeuilles?\s+suivis?\s+par\s+mois$/i);
    if (match) return Number(match[1]);
  }
  return null;
}

/**
 * Same reasoning as getMaxTrackedWallets: "3 copy trading par semaine" is
 * enforced as at most N simultaneously active strategies, not N
 * activations per week. Returns null when unlimited.
 */
export function getMaxActiveCopyTradingStrategies(plan: PricingPlan): number | null {
  for (const feature of plan.features) {
    const match = feature.match(/^(\d+)\s+copy\s+trading\s+par\s+semaine$/i);
    if (match) return Number(match[1]);
  }
  return null;
}
