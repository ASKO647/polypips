import { TrendingUp, Zap, ShieldCheck, Headset, type LucideIcon } from "lucide-react";

export type SignupBenefit = {
  icon: LucideIcon;
  /** Key into the Auth.SignupBenefits translation namespace. */
  key: "precision" | "time" | "secure" | "support";
};

export const SIGNUP_BENEFITS: SignupBenefit[] = [
  { icon: TrendingUp, key: "precision" },
  { icon: Zap, key: "time" },
  { icon: ShieldCheck, key: "secure" },
  { icon: Headset, key: "support" },
];
