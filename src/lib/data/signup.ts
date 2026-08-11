import { TrendingUp, Zap, ShieldCheck, Headset, type LucideIcon } from "lucide-react";

export type SignupBenefit = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const SIGNUP_BENEFITS: SignupBenefit[] = [
  {
    icon: TrendingUp,
    title: "Analyses ultra-précises",
    description:
      "Une IA qui décortique chaque marché en profondeur pour un signal fiable.",
  },
  {
    icon: Zap,
    title: "Gagnez du temps",
    description: "Fini les heures de recherche : une décision claire, expliquée.",
  },
  {
    icon: ShieldCheck,
    title: "100% sécurisé",
    description: "Vos données et vos accès sont protégés à chaque étape.",
  },
  {
    icon: Headset,
    title: "Support dédié",
    description: "Une équipe disponible pour vous accompagner à tout moment.",
  },
];
