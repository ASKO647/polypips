import {
  Award,
  BarChart3,
  Cpu,
  Database,
  Gauge,
  Heart,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

export type ProofStat = {
  id: string;
  icon: LucideIcon;
  value: string;
  label: string;
};

export const PROOF_STATS: ProofStat[] = [
  { id: "precision", icon: Target, value: "92.2%", label: "Précision moyenne" },
  { id: "markets", icon: BarChart3, value: "879", label: "Marchés analysés" },
  { id: "users", icon: Users, value: "+12 000", label: "Utilisateurs actifs" },
  { id: "analyses", icon: TrendingUp, value: "+68 000", label: "Analyses réalisées" },
];

export type ProofPill = {
  id: string;
  icon: LucideIcon;
  label: string;
};

export const PROOF_PILLS: ProofPill[] = [
  { id: "ai", icon: Cpu, label: "IA spécialisée marchés" },
  { id: "realtime", icon: Database, label: "Données en temps réel" },
  { id: "accuracy", icon: Gauge, label: "Analyses ultra précises" },
  { id: "proven", icon: Award, label: "Résultats prouvés" },
  { id: "satisfaction", icon: Heart, label: "Utilisateurs satisfaits" },
];

export type PhoneScreen =
  | {
      kind: "market-analysis";
      tab: string;
      question: string;
      tag: string;
      decision: "YES" | "NO";
      probability: number;
      opportunityScore: number;
      confidenceLabel: string;
      cta: string;
    }
  | {
      kind: "history";
      items: {
        match: string;
        result: "YES" | "NO";
        percent: number;
        amount: string;
        positive: boolean;
        date: string;
      }[];
    }
  | {
      kind: "performance";
      period: string;
      totalGainLabel: string;
      totalGain: string;
      stats: { label: string; value: string }[];
    }
  | {
      kind: "match-detail";
      teamA: string;
      teamB: string;
      analysisText: string;
      probabilities: { label: string; percent: number; tone: "brand" | "neutral" }[];
    }
  | {
      kind: "portfolio";
      allocationLabel: string;
      allocationValue: string;
      allocationContext: string;
      movements: { label: string; amount: string; positive: boolean }[];
    };

export type ProofPhone = {
  id: string;
  appTitle: string;
  screen: PhoneScreen;
  resultHeadline: string;
  resultGain: string;
  resultContext: string;
  handle: string;
  avatarGradient: string;
};

const AVATAR_GRADIENTS = [
  "from-brand-300 to-brand-500",
  "from-orange-300 to-brand-400",
  "from-rose-300 to-brand-500",
  "from-brand-400 to-brand-700",
  "from-orange-400 to-rose-500",
];

export const PROOF_PHONES: ProofPhone[] = [
  {
    id: "market-analysis",
    appTitle: "Analyse de marché",
    screen: {
      kind: "market-analysis",
      tab: "Analyse IA",
      question: "Le Real Madrid remportera-t-il le prochain clasico ?",
      tag: "LaLiga",
      decision: "YES",
      probability: 68,
      opportunityScore: 87,
      confidenceLabel: "Confiance élevée",
      cta: "Voir l'analyse complète",
    },
    resultHeadline: "Prédiction gagnante ✅",
    resultGain: "+2 890 €",
    resultContext: "en 5 jours",
    handle: "@alex_trader",
    avatarGradient: AVATAR_GRADIENTS[0],
  },
  {
    id: "history",
    appTitle: "Historique des analyses",
    screen: {
      kind: "history",
      items: [
        {
          match: "Real Madrid vs FC Barcelone",
          result: "YES",
          percent: 68,
          amount: "+2 890 €",
          positive: true,
          date: "12/04/2024",
        },
        {
          match: "PSG vs OM",
          result: "YES",
          percent: 71,
          amount: "+1 220 €",
          positive: true,
          date: "10/04/2024",
        },
        {
          match: "Man City vs Arsenal",
          result: "NO",
          percent: 34,
          amount: "-320 €",
          positive: false,
          date: "09/04/2024",
        },
        {
          match: "Bayern vs Dortmund",
          result: "YES",
          percent: 69,
          amount: "+1 750 €",
          positive: true,
          date: "07/04/2024",
        },
      ],
    },
    resultHeadline: "Régularité exceptionnelle 🔥",
    resultGain: "+3 436 €",
    resultContext: "cette semaine",
    handle: "@max_prono",
    avatarGradient: AVATAR_GRADIENTS[1],
  },
  {
    id: "performance",
    appTitle: "Performance globale",
    screen: {
      kind: "performance",
      period: "7 derniers jours",
      totalGainLabel: "Gain total",
      totalGain: "+8 920 €",
      stats: [
        { label: "Analyses", value: "186" },
        { label: "Précision", value: "92.2%" },
        { label: "ROI moyen", value: "+17.4%" },
        { label: "Marchés analysés", value: "879" },
      ],
    },
    resultHeadline: "Grâce à l'IA Polypips",
    resultGain: "+4 120 €",
    resultContext: "en 1 semaine",
    handle: "@sarah_trade",
    avatarGradient: AVATAR_GRADIENTS[2],
  },
  {
    id: "match-detail",
    appTitle: "Détail d'une analyse",
    screen: {
      kind: "match-detail",
      teamA: "Real Madrid",
      teamB: "FC Barcelone",
      analysisText:
        "Le Real Madrid présente plus de chances de victoire grâce à sa solidité défensive et sa forme actuelle.",
      probabilities: [
        { label: "Real Madrid", percent: 68, tone: "brand" },
        { label: "Match nul", percent: 21, tone: "neutral" },
        { label: "FC Barcelone", percent: 11, tone: "neutral" },
      ],
    },
    resultHeadline: "Pronostics validés 🎯",
    resultGain: "+5 610 €",
    resultContext: "en automatique",
    handle: "@football_invest",
    avatarGradient: AVATAR_GRADIENTS[3],
  },
  {
    id: "portfolio",
    appTitle: "Portefeuille Smart Money",
    screen: {
      kind: "portfolio",
      allocationLabel: "Allocation détectée",
      allocationValue: "+12.4%",
      allocationContext: "sur les 7 derniers jours",
      movements: [
        { label: "Achat massif Real Madrid", amount: "+240K €", positive: true },
        { label: "Achat PSG", amount: "+180K €", positive: true },
        { label: "Vente Man City", amount: "-120K €", positive: false },
        { label: "Achat Bayern", amount: "+210K €", positive: true },
      ],
    },
    resultHeadline: "Une croissance constante",
    resultGain: "+8 920 €",
    resultContext: "ce mois-ci",
    handle: "@anto_gagne",
    avatarGradient: AVATAR_GRADIENTS[4],
  },
];
