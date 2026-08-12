import { type MarketAnalysis } from "@/lib/data/analysis";

const FEATURED_MOCK_MARKET: MarketAnalysis = {
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

const RECENT_MOCK_MARKETS: MarketAnalysis[] = [
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

const NEW_MOCK_MARKETS: MarketAnalysis[] = [
  {
    id: "senate-majority-2026",
    question: "Le Parti Démocrate conservera-t-il la majorité au Sénat en 2026 ?",
    category: "Politique US",
    analyzedAt: "Il y a 5 heures",
    decision: "NO",
    aiProbability: 38,
    marketProbability: 47,
    edge: -9,
    opportunityScore: 64,
    confidence: "Moyenne",
    explanation:
      "Le nombre de sièges à défendre par les Démocrates cette année est structurellement défavorable et les sondages génériques se resserrent depuis 6 semaines. Le marché semble encore un peu optimiste sur leurs chances de conserver la majorité.",
    favorableFactors: [
      "Avantage historique du parti sortant à la présidentielle sur la participation",
      "Financement de campagne actuellement supérieur dans plusieurs états clés",
    ],
    risks: [
      "Carte électorale du Sénat très défavorable cette année",
      "Tassement net des intentions de vote sur les 6 dernières semaines",
      "Plusieurs sièges disputés dans des états historiquement swing",
    ],
    whatCouldChange:
      "Un évènement macroéconomique majeur dans les prochains mois pourrait rapidement rebattre les intentions de vote.",
    sources: [
      { name: "Polymarket — historique des cotes", url: "https://polymarket.com" },
      { name: "Agrégateur de sondages", url: "https://www.natesilver.net" },
    ],
  },
  {
    id: "djokovic-roland-garros",
    question: "Novak Djokovic remportera-t-il Roland Garros 2026 ?",
    category: "Tennis",
    analyzedAt: "Il y a 8 heures",
    decision: "YES",
    aiProbability: 41,
    marketProbability: 33,
    edge: 8,
    opportunityScore: 55,
    confidence: "Faible",
    explanation:
      "Malgré l'âge, la régularité sur terre battue reste au rendez-vous cette saison et le tableau s'annonce dégagé jusqu'en demi-finale. L'incertitude physique sur un tournoi en 5 sets reste néanmoins réelle, d'où une confiance limitée.",
    favorableFactors: [
      "Meilleur bilan sur terre battue des joueurs encore en lice cette saison",
      "Tableau favorable jusqu'en demi-finale",
    ],
    risks: [
      "Charge physique d'un tournoi en 5 sets à cet âge",
      "Concurrence jeune en pleine forme sur cette surface",
      "Historique récent de forfaits sur blessure en cours de tournoi",
    ],
    whatCouldChange:
      "Un tirage au sort défavorable en quart de finale changerait significativement cette estimation.",
    sources: [
      { name: "Polymarket — historique des cotes", url: "https://polymarket.com" },
      { name: "Classement ATP", url: "https://www.atptour.com" },
    ],
  },
  {
    id: "apple-vision-pro-2026",
    question: "Apple annoncera-t-elle un nouveau Vision Pro d'ici fin 2026 ?",
    category: "Tech",
    analyzedAt: "Hier",
    decision: "NO",
    aiProbability: 27,
    marketProbability: 36,
    edge: -9,
    opportunityScore: 48,
    confidence: "Moyenne",
    explanation:
      "Les indices de la chaîne d'approvisionnement ne montrent pour l'instant aucun signal de production en volume d'une nouvelle version. Le marché semble anticiper une annonce plus rapide que ce que suggèrent les fuites actuelles.",
    favorableFactors: [
      "Cycle de renouvellement habituel d'Apple sur ses lignes de produits",
      "Rumeurs persistantes de composants allégés en test",
    ],
    risks: [
      "Aucun signal de production en volume détecté à ce stade",
      "Calendrier des annonces Apple historiquement imprévisible",
    ],
    whatCouldChange:
      "L'apparition de références de production dans la chaîne d'approvisionnement ferait rapidement monter cette probabilité.",
    sources: [
      { name: "Polymarket — historique des cotes", url: "https://polymarket.com" },
      { name: "Rapports chaîne d'approvisionnement", url: "https://www.bloomberg.com" },
    ],
  },
];

export const MOCK_MARKETS: MarketAnalysis[] = [
  FEATURED_MOCK_MARKET,
  ...RECENT_MOCK_MARKETS,
  ...NEW_MOCK_MARKETS,
];
