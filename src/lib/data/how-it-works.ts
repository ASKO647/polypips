import {
  UploadCloud,
  BrainCircuit,
  Target,
  LineChart,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type HowItWorksStep = {
  number: string;
  id: "import" | "analyze" | "decide" | "track" | "act";
  icon: LucideIcon;
};

/** Structural data only — title/description text lives in the
 * `HowItWorks.steps` translation namespace, keyed by `id`. */
export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  { number: "01", id: "import", icon: UploadCloud },
  { number: "02", id: "analyze", icon: BrainCircuit },
  { number: "03", id: "decide", icon: Target },
  { number: "04", id: "track", icon: LineChart },
  { number: "05", id: "act", icon: Zap },
];
