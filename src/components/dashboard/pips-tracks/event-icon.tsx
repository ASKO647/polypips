import { ExternalLink, Newspaper, Sparkles, TrendingDown, TrendingUp, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipsTrackEvent } from "@/lib/data/pips-tracks";

/** One colored circular icon per event type — mirrors the mockup's
 * source-colored dots (green=Fomo, violet=Axiom, dark=X, orange=Signal
 * IA) without relying on any real per-token/per-source logo asset, none
 * of which exist in this codebase today (see the architecture research:
 * Solana memecoin wallets have no logo, and Fomo/Axiom/X have no branding
 * asset licensed for use here). */
const ICON_STYLES: Record<PipsTrackEvent["eventType"], { className: string; icon: typeof TrendingUp }> = {
  trade_buy: { className: "bg-emerald-500/15 text-emerald-400", icon: TrendingUp },
  trade_sell: { className: "bg-rose-500/15 text-rose-400", icon: TrendingDown },
  signal_ia: { className: "bg-amber-500/15 text-amber-400", icon: Sparkles },
  wallet_active: { className: "bg-violet-500/15 text-violet-400", icon: UserCheck },
  news: { className: "bg-sky-500/15 text-sky-400", icon: Newspaper },
  x_post: { className: "bg-white/10 text-white/70", icon: ExternalLink },
};

export function EventIcon({ eventType, className }: { eventType: PipsTrackEvent["eventType"]; className?: string }) {
  const style = ICON_STYLES[eventType];
  const Icon = style.icon;
  return (
    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", style.className, className)}>
      <Icon className="h-4 w-4" strokeWidth={2} />
    </span>
  );
}
