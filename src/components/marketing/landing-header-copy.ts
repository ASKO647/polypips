// The locale comes from next-intl; keeping this small catalog with the component
// also makes the new landing copy available immediately during local development.
const landingHeaderCopy = {
  fr: {
    users: "Plus de {count} clients actifs",
    universes: "POLYMARKET · SPORT · TRADING",
    title1: "Arrêtez de deviner.",
    title2Lead: "Prenez ",
    title2Accent: "l’avantage.",
    description1: "Polymarket, sport et trading : des analyses IA claires",
    description2: "pour repérer les opportunités et décider avec confiance.",
    cta: "Débloquer mes analyses pour 1,00 €",
    shortCta: "Débutez pour 1,00 €",
    support: "Une plateforme. Trois univers à analyser.",
    benefits: ["Analyses détaillées", "Historique centralisé", "Vous gardez le contrôle"],
    sport: "Sport",
    universeLabel: "Accéder aux analyses",
  },
  en: {
    users: "Over {count} active customers",
    universes: "POLYMARKET · SPORTS · TRADING",
    title1: "Stop guessing.",
    title2Lead: "Gain ",
    title2Accent: "an edge.",
    description1: "Polymarket, sports and trading: clear AI analyses",
    description2: "to spot opportunities and make informed decisions.",
    cta: "Unlock my analyses for $1.00",
    shortCta: "Get started for $1.00",
    support: "One platform. Three worlds to analyze.",
    benefits: ["Detailed analyses", "Centralized history", "You stay in control"],
    sport: "Sports",
    universeLabel: "Explore the analyses",
  },
} as const;

export function getLandingHeaderCopy(locale: string) {
  return landingHeaderCopy[locale === "en" ? "en" : "fr"];
}
