/**
 * Shape mirrors what the real analysis pipeline (screenshot/link -> AI
 * decision) will eventually return, so wiring in the real API later is a
 * data-source swap rather than a UI rewrite.
 */

export type AnalysisDecision = "YES" | "NO";
export type ConfidenceLevel = "Faible" | "Moyenne" | "Élevée";

export type AnalysisSource = {
  name: string;
  url: string;
};

export type MarketAnalysis = {
  id: string;
  question: string;
  category: string;
  analyzedAt: string;
  decision: AnalysisDecision;
  aiProbability: number;
  marketProbability: number;
  edge: number;
  opportunityScore: number;
  confidence: ConfidenceLevel;
  explanation: string;
  favorableFactors: string[];
  risks: string[];
  whatCouldChange: string;
  sources: AnalysisSource[];
};

export const ANALYSIS_LOADING_STEPS: string[] = [
  "Lecture du marché...",
  "Analyse des données...",
  "Calcul de la probabilité...",
  "Génération de l'explication...",
];

export const NEW_ANALYSIS_RESULT: MarketAnalysis = {
  id: "clasico-real-madrid",
  question: "Le Real Madrid remportera-t-il le prochain clasico ?",
  category: "LaLiga",
  analyzedAt: "À l'instant",
  decision: "YES",
  aiProbability: 68,
  marketProbability: 51,
  edge: 17,
  opportunityScore: 87,
  confidence: "Élevée",
  explanation:
    "Le Real Madrid aborde ce clasico avec un effectif au complet et une dynamique offensive nettement supérieure à celle du Barça sur les 5 derniers matchs. L'écart entre notre probabilité et celle du marché suggère que ce dernier sous-estime encore l'impact du retour de ses titulaires clés.",
  favorableFactors: [
    "4 victoires sur les 5 derniers matchs toutes compétitions confondues",
    "Retour de titulaires clés après blessure",
    "Avantage du terrain (Bernabéu)",
    "Barça diminué par plusieurs absences en défense",
  ],
  risks: [
    "Historique récent équilibré en clasico (3 victoires partout sur les 6 derniers)",
    "Enjeu émotionnel élevé pouvant favoriser un scénario imprévisible",
  ],
  whatCouldChange:
    "Une nouvelle blessure d'un titulaire offensif du Real dans les prochains jours ferait significativement baisser cette probabilité.",
  sources: [
    { name: "Polymarket — historique des cotes", url: "https://polymarket.com" },
    { name: "Statistiques officielles LaLiga", url: "https://www.laliga.com" },
    { name: "Rapports d'avant-match", url: "https://www.marca.com" },
  ],
};

export const RECENT_ANALYSES: MarketAnalysis[] = [
  {
    id: "bitcoin-100k",
    question: "Le Bitcoin dépassera-t-il 100 000 $ ce mois-ci ?",
    category: "Crypto",
    analyzedAt: "Il y a 2 heures",
    decision: "NO",
    aiProbability: 34,
    marketProbability: 44,
    edge: -10,
    opportunityScore: 61,
    confidence: "Moyenne",
    explanation:
      "Le momentum haussier des dernières semaines ralentit et les indicateurs on-chain montrent une prise de profits croissante des gros portefeuilles. Le marché semble légèrement optimiste par rapport à la dynamique actuelle.",
    favorableFactors: [
      "Flux entrants toujours positifs sur les ETF spot",
      "Contexte macro globalement favorable au risque",
    ],
    risks: [
      "Ralentissement net du volume sur les dernières 72h",
      "Résistance technique forte juste au-dessus du cours actuel",
      "Sensibilité élevée aux annonces macro US cette semaine",
    ],
    whatCouldChange:
      "Une décision de taux plus accommodante que prévu de la Fed pourrait relancer la dynamique haussière rapidement.",
    sources: [
      { name: "Polymarket — historique des cotes", url: "https://polymarket.com" },
      { name: "Données on-chain Glassnode", url: "https://glassnode.com" },
    ],
  },
  {
    id: "lakers-playoffs",
    question: "Les Lakers se qualifieront-ils pour les playoffs ?",
    category: "NBA",
    analyzedAt: "Hier",
    decision: "YES",
    aiProbability: 74,
    marketProbability: 69,
    edge: 5,
    opportunityScore: 52,
    confidence: "Moyenne",
    explanation:
      "La forme actuelle de l'effectif et le calendrier restant, plus favorable que la moyenne de la conférence, placent les Lakers en position confortable. L'écart avec le marché reste toutefois modeste.",
    favorableFactors: [
      "Calendrier restant parmi les plus favorables de la conférence Ouest",
      "Retour à la santé de plusieurs joueurs clés",
      "6 victoires sur les 8 derniers matchs",
    ],
    risks: [
      "Concurrence resserrée pour les dernières places qualificatives",
      "Fatigue accumulée sur la fin de saison",
    ],
    whatCouldChange:
      "Une nouvelle blessure longue durée d'un titulaire changerait significativement la trajectoire de fin de saison.",
    sources: [
      { name: "Polymarket — historique des cotes", url: "https://polymarket.com" },
      { name: "Statistiques officielles NBA", url: "https://www.nba.com/stats" },
      { name: "Analyses de calendrier", url: "https://www.espn.com" },
    ],
  },
  {
    id: "fed-taux-mars",
    question: "La Fed baissera-t-elle ses taux directeurs en mars ?",
    category: "Économie",
    analyzedAt: "Il y a 3 jours",
    decision: "NO",
    aiProbability: 22,
    marketProbability: 31,
    edge: -9,
    opportunityScore: 58,
    confidence: "Élevée",
    explanation:
      "Les dernières déclarations des membres du FOMC restent prudentes et l'inflation sous-jacente se maintient au-dessus de l'objectif. Le marché semble accorder une probabilité un peu trop élevée à une baisse dès mars.",
    favorableFactors: [
      "Ralentissement progressif de l'inflation sur 3 mois",
      "Marché de l'emploi qui commence à montrer des signes de faiblesse",
    ],
    risks: [
      "Discours des gouverneurs de la Fed encore majoritairement prudent",
      "Prochaine publication de l'inflation avant la réunion pourrait changer la donne",
      "Historique de décisions plus accommodantes qu'anticipé",
    ],
    whatCouldChange:
      "Une publication d'inflation nettement sous les attentes dans les prochaines semaines augmenterait fortement la probabilité d'une baisse.",
    sources: [
      { name: "Polymarket — historique des cotes", url: "https://polymarket.com" },
      { name: "Communiqués FOMC", url: "https://www.federalreserve.gov" },
    ],
  },
];
