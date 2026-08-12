/**
 * Shapes mirror what a real on-chain / Polymarket-API-backed wallet tracker
 * would return, so swapping the mock list for a live feed later is a
 * data-source change rather than a UI rewrite.
 */

export type WalletPosition = {
  id: string;
  market: string;
  side: "YES" | "NO";
  amount: number;
  pnl: number;
};

export type WalletMovement = {
  id: string;
  type: "Achat" | "Vente";
  market: string;
  amount: number;
  timeAgo: string;
};

export type Wallet = {
  id: string;
  handle: string;
  totalValue: number;
  changePercent: number;
  activePositionsCount: number;
  marketsTrackedCount: number;
  chart: number[];
  positions: WalletPosition[];
  recentMovements: WalletMovement[];
  history: WalletMovement[];
};

export const MOCK_WALLETS: Wallet[] = [
  {
    id: "whale-trader-eth",
    handle: "whale_trader.eth",
    totalValue: 1_240_000,
    changePercent: 18.6,
    activePositionsCount: 14,
    marketsTrackedCount: 9,
    chart: [40, 42, 41, 45, 48, 47, 52, 55, 58, 60, 63, 68, 72, 78],
    positions: [
      {
        id: "p1",
        market: "Real Madrid vs FC Barcelone",
        side: "YES",
        amount: 240_000,
        pnl: 38_400,
      },
      {
        id: "p2",
        market: "Bitcoin > 100 000 $ (2026)",
        side: "NO",
        amount: 180_000,
        pnl: -12_600,
      },
      {
        id: "p3",
        market: "Lakers qualifiés playoffs",
        side: "YES",
        amount: 95_000,
        pnl: 9_100,
      },
      {
        id: "p4",
        market: "Djokovic vainqueur Roland Garros",
        side: "YES",
        amount: 60_000,
        pnl: 4_200,
      },
    ],
    recentMovements: [
      { id: "m1", type: "Achat", market: "Real Madrid vs FC Barcelone", amount: 240_000, timeAgo: "Il y a 12 min" },
      { id: "m2", type: "Achat", market: "PSG vainqueur Ligue des Champions", amount: 180_000, timeAgo: "Il y a 2h" },
      { id: "m3", type: "Vente", market: "Man City vainqueur Premier League", amount: 120_000, timeAgo: "Il y a 6h" },
    ],
    history: [
      { id: "h1", type: "Achat", market: "Bayern vainqueur Bundesliga", amount: 210_000, timeAgo: "Hier" },
      { id: "h2", type: "Vente", market: "Fed baisse taux (mars)", amount: 90_000, timeAgo: "Il y a 2 jours" },
      { id: "h3", type: "Achat", market: "Lakers qualifiés playoffs", amount: 95_000, timeAgo: "Il y a 5 jours" },
    ],
  },
  {
    id: "0x7a3f-9c2d",
    handle: "0x7a3f...9c2d",
    totalValue: 640_000,
    changePercent: -4.2,
    activePositionsCount: 8,
    marketsTrackedCount: 6,
    chart: [60, 59, 61, 58, 57, 59, 56, 55, 57, 54, 53, 55, 52, 51],
    positions: [
      {
        id: "p1",
        market: "Fed baisse taux (mars)",
        side: "NO",
        amount: 130_000,
        pnl: 14_300,
      },
      {
        id: "p2",
        market: "Sénat US majorité démocrate",
        side: "NO",
        amount: 85_000,
        pnl: -6_800,
      },
      {
        id: "p3",
        market: "Apple Vision Pro 2 (2026)",
        side: "NO",
        amount: 40_000,
        pnl: 1_900,
      },
    ],
    recentMovements: [
      { id: "m1", type: "Vente", market: "Bitcoin > 100 000 $ (2026)", amount: 75_000, timeAgo: "Il y a 40 min" },
      { id: "m2", type: "Achat", market: "Fed baisse taux (mars)", amount: 130_000, timeAgo: "Il y a 5h" },
    ],
    history: [
      { id: "h1", type: "Vente", market: "Djokovic vainqueur Roland Garros", amount: 55_000, timeAgo: "Hier" },
      { id: "h2", type: "Achat", market: "Sénat US majorité démocrate", amount: 85_000, timeAgo: "Il y a 3 jours" },
    ],
  },
  {
    id: "polymarket-whale",
    handle: "polymarket_whale",
    totalValue: 2_180_000,
    changePercent: 6.1,
    activePositionsCount: 21,
    marketsTrackedCount: 15,
    chart: [50, 55, 48, 53, 58, 52, 60, 57, 63, 59, 65, 61, 66, 63],
    positions: [
      {
        id: "p1",
        market: "Bitcoin > 100 000 $ (2026)",
        side: "YES",
        amount: 420_000,
        pnl: 51_000,
      },
      {
        id: "p2",
        market: "Real Madrid vs FC Barcelone",
        side: "YES",
        amount: 300_000,
        pnl: -18_000,
      },
      {
        id: "p3",
        market: "Apple Vision Pro 2 (2026)",
        side: "NO",
        amount: 150_000,
        pnl: 8_400,
      },
    ],
    recentMovements: [
      { id: "m1", type: "Achat", market: "Bitcoin > 100 000 $ (2026)", amount: 420_000, timeAgo: "Il y a 25 min" },
      { id: "m2", type: "Achat", market: "Lakers qualifiés playoffs", amount: 110_000, timeAgo: "Il y a 3h" },
      { id: "m3", type: "Vente", market: "PSG vainqueur Ligue des Champions", amount: 95_000, timeAgo: "Il y a 9h" },
    ],
    history: [
      { id: "h1", type: "Achat", market: "Apple Vision Pro 2 (2026)", amount: 150_000, timeAgo: "Il y a 2 jours" },
      { id: "h2", type: "Achat", market: "Real Madrid vs FC Barcelone", amount: 300_000, timeAgo: "Il y a 4 jours" },
    ],
  },
  {
    id: "0xb4e1-77aa",
    handle: "0xB4e1...77Aa",
    totalValue: 310_000,
    changePercent: 2.4,
    activePositionsCount: 5,
    marketsTrackedCount: 4,
    chart: [50, 51, 49, 52, 50, 53, 51, 54, 52, 55, 53, 54, 52, 53],
    positions: [
      {
        id: "p1",
        market: "Lakers qualifiés playoffs",
        side: "YES",
        amount: 90_000,
        pnl: 5_200,
      },
      {
        id: "p2",
        market: "Sénat US majorité démocrate",
        side: "NO",
        amount: 60_000,
        pnl: 1_100,
      },
    ],
    recentMovements: [
      { id: "m1", type: "Achat", market: "Lakers qualifiés playoffs", amount: 90_000, timeAgo: "Il y a 1h" },
    ],
    history: [
      { id: "h1", type: "Vente", market: "Djokovic vainqueur Roland Garros", amount: 30_000, timeAgo: "Il y a 3 jours" },
    ],
  },
  {
    id: "smart-money-fund",
    handle: "smart_money_fund",
    totalValue: 980_000,
    changePercent: -11.3,
    activePositionsCount: 12,
    marketsTrackedCount: 10,
    chart: [70, 68, 65, 63, 60, 58, 55, 57, 53, 50, 48, 45, 43, 41],
    positions: [
      {
        id: "p1",
        market: "Man City vainqueur Premier League",
        side: "YES",
        amount: 210_000,
        pnl: -34_000,
      },
      {
        id: "p2",
        market: "Fed baisse taux (mars)",
        side: "YES",
        amount: 140_000,
        pnl: -9_600,
      },
      {
        id: "p3",
        market: "Bitcoin > 100 000 $ (2026)",
        side: "NO",
        amount: 80_000,
        pnl: 3_100,
      },
    ],
    recentMovements: [
      { id: "m1", type: "Vente", market: "Man City vainqueur Premier League", amount: 60_000, timeAgo: "Il y a 2h" },
      { id: "m2", type: "Vente", market: "Fed baisse taux (mars)", amount: 45_000, timeAgo: "Il y a 8h" },
    ],
    history: [
      { id: "h1", type: "Achat", market: "Bitcoin > 100 000 $ (2026)", amount: 80_000, timeAgo: "Il y a 2 jours" },
      { id: "h2", type: "Vente", market: "Bayern vainqueur Bundesliga", amount: 55_000, timeAgo: "Il y a 6 jours" },
    ],
  },
  {
    id: "0x9fc2-1d8e",
    handle: "0x9Fc2...1D8e",
    totalValue: 175_000,
    changePercent: 24.9,
    activePositionsCount: 6,
    marketsTrackedCount: 5,
    chart: [30, 32, 31, 35, 38, 40, 45, 48, 52, 58, 63, 70, 78, 85],
    positions: [
      {
        id: "p1",
        market: "Apple Vision Pro 2 (2026)",
        side: "NO",
        amount: 45_000,
        pnl: 7_800,
      },
      {
        id: "p2",
        market: "Djokovic vainqueur Roland Garros",
        side: "YES",
        amount: 30_000,
        pnl: 4_500,
      },
    ],
    recentMovements: [
      { id: "m1", type: "Achat", market: "Djokovic vainqueur Roland Garros", amount: 30_000, timeAgo: "Il y a 18 min" },
      { id: "m2", type: "Achat", market: "Apple Vision Pro 2 (2026)", amount: 45_000, timeAgo: "Il y a 4h" },
    ],
    history: [
      { id: "h1", type: "Achat", market: "Sénat US majorité démocrate", amount: 20_000, timeAgo: "Il y a 4 jours" },
    ],
  },
];
