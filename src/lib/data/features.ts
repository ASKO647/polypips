import {
  Brain,
  Radar,
  Trophy,
  LineChart,
  Sparkles,
  MessageCircleHeart,
  type LucideIcon,
} from "lucide-react";

export type Feature = {
  id: "aiAnalysis" | "smartWallet" | "sport" | "trading" | "aiSelected" | "aiCoach";
  icon: LucideIcon;
};

/** Structural data only — title/description text lives in the `Features`
 * translation namespace, keyed by `id`. Kept in sync with the current
 * product surface: Smart Wallet (manual address search & follow, no
 * auto-discovery, no automated execution), AI Sport analysis, and AI
 * Trading chart analysis. */
export const FEATURES: Feature[] = [
  { id: "aiAnalysis", icon: Brain },
  { id: "smartWallet", icon: Radar },
  { id: "sport", icon: Trophy },
  { id: "trading", icon: LineChart },
  { id: "aiSelected", icon: Sparkles },
  { id: "aiCoach", icon: MessageCircleHeart },
];
