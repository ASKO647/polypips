const copy = {
  fr: {
    eyebrow: "SIMULATEUR POLYPIPS", title: "Votre stratégie,", accent: "en chiffres.",
    description: "Faites varier vos hypothèses et visualisez un résultat mensuel simulé.",
    settings: "Réglez votre scénario", interactive: "Interactif", reset: "Réinitialiser",
    fields: {
      stake: { label: "Mise moyenne par opportunité", description: "Le montant moyen engagé sur une opportunité." },
      opportunities: { label: "Opportunités par mois", description: "Le nombre d’opportunités prises en compte dans le scénario." },
      yieldRate: { label: "Hypothèse de rendement", description: "Une hypothèse réglable, qui peut aussi être négative." },
    },
    calculation: "Le calcul", understand: "Comprendre le calcul", result: "RÉSULTAT MENSUEL SIMULÉ",
    beforeFees: "Avant frais et abonnement", illustrative: "Scénario illustratif", total: "Total des mises", hypothesis: "Hypothèse",
    cta: "Débuter pour 1,00 €", weeks: ["S1", "S2", "S3", "S4"],
    disclaimer: "Simulation théorique fondée sur vos hypothèses. Les résultats réels peuvent être négatifs.",
    explanation: "La mise moyenne multipliée par le nombre d’opportunités donne le volume total des mises du mois. Ce volume peut inclure des mises successives : il ne représente pas un capital de départ. Le rendement hypothétique s’applique à ce volume ; les frais et l’abonnement ne sont pas déduits.",
    graph: "Répartition linéaire illustrative du résultat simulé sur quatre semaines.",
    limits: "Valeur autorisée", to: "à", volumeLine: "de mises sur le mois", profitLine: "de résultat simulé", chartLabel: "Résultat simulé par semaine",
  },
  en: {
    eyebrow: "POLYPIPS SIMULATOR", title: "Your strategy,", accent: "in numbers.",
    description: "Adjust your assumptions and explore a simulated monthly result.",
    settings: "Set your scenario", interactive: "Interactive", reset: "Reset",
    fields: {
      stake: { label: "Average stake per opportunity", description: "The average amount staked on one opportunity." },
      opportunities: { label: "Opportunities per month", description: "The number of opportunities included in the scenario." },
      yieldRate: { label: "Assumed return", description: "An adjustable assumption that can also be negative." },
    },
    calculation: "The calculation", understand: "Understand the calculation", result: "SIMULATED MONTHLY RESULT",
    beforeFees: "Before fees and subscription", illustrative: "Illustrative scenario", total: "Total stakes", hypothesis: "Assumption",
    cta: "Get started for $1.00", weeks: ["W1", "W2", "W3", "W4"],
    disclaimer: "A theoretical simulation based on your assumptions. Actual results may be negative.",
    explanation: "The average stake multiplied by the number of opportunities gives the total monthly staking volume. This volume can include successive stakes: it does not represent starting capital. The assumed return applies to this volume; fees and the subscription are not deducted.",
    graph: "An illustrative linear distribution of the simulated result over four weeks.",
    limits: "Allowed value", to: "to", volumeLine: "in stakes over the month", profitLine: "simulated result", chartLabel: "Simulated result by week",
  },
} as const;
export function getSimulatorCopy(locale: string) { return copy[locale === "en" ? "en" : "fr"]; }
export type SimulatorCopy = ReturnType<typeof getSimulatorCopy>;
