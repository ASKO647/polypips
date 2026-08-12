/**
 * Shapes anticipate a real copy-trading execution backend: risk params as
 * raw numbers (validated/enforced server-side later), positions carrying an
 * explicit status rather than being inferred from other fields. All stats
 * here are historical/mocked and must stay presented as such in the UI -
 * never as a promise of future performance.
 */

export type RiskParameters = {
  maxPositionAmount: number;
  maxExposure: number;
  maxSimultaneousPositions: number;
};

export type Strategy = {
  id: string;
  name: string;
  description: string;
  historicalRoi: number;
  successRate: number;
  copiedTradesCount: number;
  defaultRiskParameters: RiskParameters;
  copiedPositions: CopiedPosition[];
};

export type CopiedPositionStatus = "En cours" | "Clôturée";

export type CopiedPosition = {
  id: string;
  market: string;
  amount: number;
  date: string;
  status: CopiedPositionStatus;
  result?: number;
};

export const MOCK_STRATEGIES: Strategy[] = [
  {
    id: "whale-trader-eth",
    name: "Suivre whale_trader.eth",
    description:
      "Copie automatiquement les positions ouvertes par whale_trader.eth dès qu'elles apparaissent sur son portefeuille.",
    historicalRoi: 22.4,
    successRate: 68,
    copiedTradesCount: 142,
    defaultRiskParameters: {
      maxPositionAmount: 500,
      maxExposure: 20,
      maxSimultaneousPositions: 5,
    },
    copiedPositions: [
      { id: "cp1", market: "Real Madrid vs FC Barcelone", amount: 240, date: "12 août, 14:32", status: "En cours" },
      { id: "cp2", market: "Bitcoin > 100 000 $ (2026)", amount: 180, date: "12 août, 09:15", status: "Clôturée", result: 34 },
      { id: "cp3", market: "Lakers qualifiés playoffs", amount: 95, date: "11 août, 21:04", status: "Clôturée", result: -18 },
      { id: "cp4", market: "Djokovic vainqueur Roland Garros", amount: 60, date: "10 août, 16:47", status: "Clôturée", result: 22 },
      { id: "cp5", market: "PSG vainqueur Ligue des Champions", amount: 180, date: "9 août, 08:30", status: "Clôturée", result: 41 },
    ],
  },
  {
    id: "polymarket-whale",
    name: "Suivre polymarket_whale",
    description:
      "Copie automatiquement les positions ouvertes par polymarket_whale dès qu'elles apparaissent sur son portefeuille.",
    historicalRoi: 14.8,
    successRate: 61,
    copiedTradesCount: 289,
    defaultRiskParameters: {
      maxPositionAmount: 800,
      maxExposure: 25,
      maxSimultaneousPositions: 8,
    },
    copiedPositions: [
      { id: "cp1", market: "Apple Vision Pro 2 (2026)", amount: 150, date: "12 août, 11:20", status: "En cours" },
      { id: "cp2", market: "Real Madrid vs FC Barcelone", amount: 300, date: "11 août, 19:10", status: "Clôturée", result: -28 },
      { id: "cp3", market: "Lakers qualifiés playoffs", amount: 110, date: "10 août, 14:05", status: "Clôturée", result: 19 },
      { id: "cp4", market: "Bitcoin > 100 000 $ (2026)", amount: 420, date: "9 août, 07:40", status: "Clôturée", result: 63 },
    ],
  },
  {
    id: "smart-money-top10",
    name: "Stratégie Smart Money Top 10",
    description:
      "Réplique les mouvements agrégés des 10 portefeuilles Smart Money les plus suivis sur Polypips.",
    historicalRoi: 17.1,
    successRate: 64,
    copiedTradesCount: 512,
    defaultRiskParameters: {
      maxPositionAmount: 300,
      maxExposure: 15,
      maxSimultaneousPositions: 10,
    },
    copiedPositions: [
      { id: "cp1", market: "Fed baisse taux (mars)", amount: 130, date: "12 août, 10:02", status: "En cours" },
      { id: "cp2", market: "Sénat US majorité démocrate", amount: 85, date: "11 août, 22:18", status: "En cours" },
      { id: "cp3", market: "Man City vainqueur Premier League", amount: 210, date: "10 août, 13:33", status: "Clôturée", result: -34 },
      { id: "cp4", market: "Bayern vainqueur Bundesliga", amount: 190, date: "9 août, 09:55", status: "Clôturée", result: 27 },
    ],
  },
  {
    id: "value-bets-ia",
    name: "Stratégie Value Bets IA",
    description:
      "Copie les marchés identifiés par notre IA comme présentant l'edge le plus élevé par rapport au marché.",
    historicalRoi: 19.6,
    successRate: 59,
    copiedTradesCount: 98,
    defaultRiskParameters: {
      maxPositionAmount: 400,
      maxExposure: 18,
      maxSimultaneousPositions: 6,
    },
    copiedPositions: [
      { id: "cp1", market: "Djokovic vainqueur Roland Garros", amount: 90, date: "12 août, 08:47", status: "En cours" },
      { id: "cp2", market: "Real Madrid vs FC Barcelone", amount: 180, date: "11 août, 15:29", status: "Clôturée", result: 29 },
      { id: "cp3", market: "Apple Vision Pro 2 (2026)", amount: 70, date: "10 août, 11:12", status: "Clôturée", result: 12 },
    ],
  },
];
