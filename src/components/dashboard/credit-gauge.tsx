"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { BrainCircuit } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

/** Full-bar reference point — 20 is exactly what a referred new user
 * starts with (15 welcome + 5 referral bonus), and close to the Pack
 * Standard's own 20 credits (the "most popular" pack on /dashboard/credits)
 * — a stable, meaningful anchor that doesn't shift depending on purchase
 * history, unlike e.g. "last pack bought". Caps visually at 100% past this
 * point rather than ever shrinking the bar for a heavy user. */
const GAUGE_FULL_AT = 20;

/** Sidebar credit balance indicator — a small gauge (not just a number) so
 * a glance shows roughly how "topped up" the user is, not just a raw
 * count. Live via Supabase Realtime on user_credits (same
 * channel/postgres_changes pattern as Communauté's message/reaction
 * subscriptions — see lib/supabase/community.ts) so a Deep Analysis
 * consumption or a credits purchase/referral reward animates the bar
 * immediately, without a page reload. Rendered inside SidebarNavContent,
 * which both the desktop sidebar and the mobile drawer share, so this
 * appears in both automatically. */
export function CreditGauge({
  userId,
  initialBalance,
  onNavigate,
}: {
  userId: string;
  initialBalance: number;
  onNavigate?: () => void;
}) {
  const t = useTranslations("Credits");
  const [balance, setBalance] = useState(initialBalance);
  // Tracks the last `initialBalance` we've adopted so a fresh
  // server-rendered value (e.g. after navigating to a page that re-fetched
  // it) can replace local state on the next render without an effect —
  // React's own documented pattern for "adjusting state when a prop
  // changes" (calling setState during render, guarded by a comparison, is
  // safe and intentionally different from calling it inside useEffect).
  const [adoptedInitialBalance, setAdoptedInitialBalance] = useState(initialBalance);
  if (initialBalance !== adoptedInitialBalance) {
    setAdoptedInitialBalance(initialBalance);
    setBalance(initialBalance);
  }

  // Two CreditGauge instances are mounted simultaneously for the same
  // user: the desktop sidebar's (always mounted, merely CSS-hidden below
  // the lg breakpoint via "hidden lg:flex" — never unmounted on mobile)
  // and the mobile drawer's (mounted lazily the first time it's opened,
  // see DashboardMobileNav). Without a unique suffix, both would call
  // supabase.channel() with the exact same topic string concurrently the
  // moment the drawer opens — a duplicate-topic subscription conflict
  // that only happens at that exact moment, not on initial page load.
  // useId() gives each mounted instance its own topic while `filter`
  // (not the topic name) is what actually scopes the postgres_changes
  // events to this user's row.
  const instanceId = useId();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`user-credits-${userId}-${instanceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_credits",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { balance?: number } | null;
          if (row && typeof row.balance === "number") {
            setBalance(row.balance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, instanceId]);

  const fillPct = Math.max(0, Math.min(100, Math.round((balance / GAUGE_FULL_AT) * 100)));

  return (
    <Link
      href="/dashboard/credits"
      onClick={onNavigate}
      className="flex flex-col gap-2 rounded-xl border border-dash-border bg-dash-surface-alt px-3.5 py-3 transition-colors hover:border-dash-border-strong"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-dash-text-secondary">
          <BrainCircuit className="h-3.5 w-3.5 shrink-0 text-brand-400" strokeWidth={2} />
          {t("gaugeLabel")}
        </span>
        <span className="shrink-0 text-xs font-bold text-dash-text">
          {balance} {t("balanceUnit", { count: balance })}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-dash-surface-strong">
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-700 ease-out"
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </Link>
  );
}
