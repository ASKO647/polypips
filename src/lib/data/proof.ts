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

/** Structural data only — labels and other display text live in the
 * `Proof` translation namespace, keyed by `id`. */

export type ProofStat = {
  id: "precision" | "markets" | "users" | "analyses";
  icon: LucideIcon;
};

export const PROOF_STATS: ProofStat[] = [
  { id: "precision", icon: Target },
  { id: "markets", icon: BarChart3 },
  { id: "users", icon: Users },
  { id: "analyses", icon: TrendingUp },
];

export type ProofPill = {
  id: "ai" | "realtime" | "accuracy" | "proven" | "satisfaction";
  icon: LucideIcon;
};

export const PROOF_PILLS: ProofPill[] = [
  { id: "ai", icon: Cpu },
  { id: "realtime", icon: Database },
  { id: "accuracy", icon: Gauge },
  { id: "proven", icon: Award },
  { id: "satisfaction", icon: Heart },
];

export type PhoneScreenData =
  | {
      kind: "market-analysis";
      decision: "YES" | "NO";
      probability: number;
      opportunityScore: number;
    }
  | {
      kind: "history";
      items: {
        result: "YES" | "NO";
        percent: number;
        amount: string;
        positive: boolean;
      }[];
    }
  | {
      kind: "performance";
      stats: {
        key: "statAnalyses" | "statPrecision" | "statRoi" | "statMarkets";
        value: string;
      }[];
    }
  | {
      kind: "match-detail";
      teamA: string;
      teamB: string;
      probabilities: {
        key: "probTeamA" | "probDraw" | "probTeamB";
        percent: number;
        tone: "brand" | "neutral";
      }[];
    }
  | {
      kind: "portfolio";
      movements: {
        key: "move1" | "move2" | "move3" | "move4";
        amount: string;
        positive: boolean;
      }[];
    };

export type ProofPhone = {
  id: "marketAnalysis" | "history" | "performance" | "matchDetail" | "portfolio";
  screen: PhoneScreenData;
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
    id: "marketAnalysis",
    screen: {
      kind: "market-analysis",
      decision: "YES",
      probability: 68,
      opportunityScore: 87,
    },
    avatarGradient: AVATAR_GRADIENTS[0],
  },
  {
    id: "history",
    screen: {
      kind: "history",
      items: [
        { result: "YES", percent: 68, amount: "+2 890 €", positive: true },
        { result: "YES", percent: 71, amount: "+1 220 €", positive: true },
        { result: "NO", percent: 34, amount: "-320 €", positive: false },
        { result: "YES", percent: 69, amount: "+1 750 €", positive: true },
      ],
    },
    avatarGradient: AVATAR_GRADIENTS[1],
  },
  {
    id: "performance",
    screen: {
      kind: "performance",
      stats: [
        { key: "statAnalyses", value: "186" },
        { key: "statPrecision", value: "92.2%" },
        { key: "statRoi", value: "+17.4%" },
        { key: "statMarkets", value: "879" },
      ],
    },
    avatarGradient: AVATAR_GRADIENTS[2],
  },
  {
    id: "matchDetail",
    screen: {
      kind: "match-detail",
      teamA: "Real Madrid",
      teamB: "FC Barcelona",
      probabilities: [
        { key: "probTeamA", percent: 68, tone: "brand" },
        { key: "probDraw", percent: 21, tone: "neutral" },
        { key: "probTeamB", percent: 11, tone: "neutral" },
      ],
    },
    avatarGradient: AVATAR_GRADIENTS[3],
  },
  {
    id: "portfolio",
    screen: {
      kind: "portfolio",
      movements: [
        { key: "move1", amount: "+240K €", positive: true },
        { key: "move2", amount: "+180K €", positive: true },
        { key: "move3", amount: "-120K €", positive: false },
        { key: "move4", amount: "+210K €", positive: true },
      ],
    },
    avatarGradient: AVATAR_GRADIENTS[4],
  },
];
