import {
  LayoutDashboard,
  Users,
  CreditCard,
  TrendingUp,
  BarChart3,
  Radio,
  Target,
  Activity,
  Bot,
  Wallet,
  FileClock,
  ShieldCheck,
  Megaphone,
  Gift,
  Music2,
  type LucideIcon,
} from "lucide-react";
import { OWNER_BASE_PATH } from "@/lib/owner-path";

export type OwnerNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const OWNER_NAV_ITEMS: OwnerNavItem[] = [
  { label: "Overview", href: OWNER_BASE_PATH, icon: LayoutDashboard },
  { label: "Users", href: `${OWNER_BASE_PATH}/users`, icon: Users },
  { label: "Subscriptions", href: `${OWNER_BASE_PATH}/subscriptions`, icon: CreditCard },
  { label: "Revenue", href: `${OWNER_BASE_PATH}/revenue`, icon: TrendingUp },
  { label: "Analytics", href: `${OWNER_BASE_PATH}/analytics`, icon: BarChart3 },
  { label: "Real-Time", href: `${OWNER_BASE_PATH}/realtime`, icon: Radio },
  { label: "Acquisition", href: `${OWNER_BASE_PATH}/acquisition`, icon: Target },
  { label: "Influenceurs", href: `${OWNER_BASE_PATH}/influencers`, icon: Megaphone },
  { label: "Parrainage", href: `${OWNER_BASE_PATH}/referrals`, icon: Gift },
  { label: "Clips TikTok", href: `${OWNER_BASE_PATH}/tiktok-clips`, icon: Music2 },
  { label: "Product Usage", href: `${OWNER_BASE_PATH}/product-usage`, icon: Activity },
  { label: "AI Usage", href: `${OWNER_BASE_PATH}/ai-usage`, icon: Bot },
  { label: "Payments", href: `${OWNER_BASE_PATH}/payments`, icon: Wallet },
  { label: "Logs", href: `${OWNER_BASE_PATH}/logs`, icon: FileClock },
  { label: "Security", href: `${OWNER_BASE_PATH}/security`, icon: ShieldCheck },
];
