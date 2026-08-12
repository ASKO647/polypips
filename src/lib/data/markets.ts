import {
  NEW_ANALYSIS_RESULT,
  RECENT_ANALYSES,
  type MarketAnalysis,
} from "@/lib/data/analysis";

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
  NEW_ANALYSIS_RESULT,
  ...RECENT_ANALYSES,
  ...NEW_MOCK_MARKETS,
];
