export type ChangelogEntry = {
  date: string;
  version: string;
  title: string;
  items: string[];
};

/** Real changelog data — starts with a single "launch" entry and is meant
 * to be appended to over time, one entry per release, newest first. */
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    date: "20 août 2026",
    version: "V1.0",
    title: "Lancement de Polypips",
    items: [
      "Analyse IA de marchés Polymarket et de matchs sportifs",
      "Sélection quotidienne de marchés par l'IA",
      "Suivi de portefeuilles Smart Money et Copy Trading en simulation",
      "Coach IA conversationnel",
      "Statistiques de suivi de performance",
    ],
  },
];
