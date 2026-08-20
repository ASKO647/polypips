"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { Plus } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { AccountStatusCard } from "@/components/dashboard/account-status-card";
import {
  DASHBOARD_NAV_ITEMS,
  DASHBOARD_RESOURCE_ITEMS,
  type DashboardNavItem,
} from "@/lib/data/dashboard-nav";
import { SPORT_CATEGORIES, SPORTS_SUB_NAV } from "@/lib/sports/nav";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";
import { cn } from "@/lib/utils";

export function SidebarNavContent({
  userEmail,
  subscription,
  onNavigate,
}: {
  userEmail: string;
  subscription: SubscriptionRow | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const renderLink = (item: DashboardNavItem) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const isSports = item.href === "/dashboard/sports";

    return (
      <div key={item.href} className="flex flex-col gap-0.5">
        <Link
          href={item.href}
          prefetch
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
            active
              ? "bg-brand-500/15 text-white"
              : "text-white/55 hover:bg-white/[0.06] hover:text-white"
          )}
        >
          <item.icon
            className={cn("h-[18px] w-[18px] shrink-0", active && "text-brand-400")}
            strokeWidth={2}
          />
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {item.badge}
            </span>
          )}
        </Link>

        {isSports && active && (
          <div className="ml-4 flex flex-col gap-0.5 border-l border-white/10 pl-3">
            {SPORTS_SUB_NAV.map((sub) => {
              const subActive = pathname === sub.href;
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  prefetch
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-150",
                    subActive
                      ? "bg-brand-500/10 text-brand-400"
                      : "text-white/45 hover:bg-white/[0.05] hover:text-white"
                  )}
                >
                  <sub.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  {sub.label}
                </Link>
              );
            })}

            <p className="mb-0.5 mt-2 px-2.5 text-[10px] font-semibold uppercase tracking-wide text-white/25">
              Sports
            </p>
            {SPORT_CATEGORIES.map((sport) => {
              const href = `/dashboard/sports/${sport.key}`;
              const subActive = pathname === href;
              return (
                <Link
                  key={sport.key}
                  href={href}
                  prefetch
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-150",
                    subActive
                      ? "bg-brand-500/10 text-brand-400"
                      : "text-white/45 hover:bg-white/[0.05] hover:text-white"
                  )}
                >
                  {sport.label}
                  {!sport.active && (
                    <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/35">
                      Bientôt
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <nav className="flex flex-1 flex-col gap-1 px-4 py-2">
        {DASHBOARD_NAV_ITEMS.map(renderLink)}

        <p className="mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wide text-white/30">
          Ressources
        </p>
        {DASHBOARD_RESOURCE_ITEMS.map(renderLink)}
      </nav>

      <div className="flex flex-col gap-3 px-4 pb-4">
        <AccountStatusCard subscription={subscription} />
        <Button href="/dashboard/analyse-ia" variant="outline" onClick={onNavigate} className="w-full">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Nouvelle analyse
        </Button>
      </div>

      <div className="border-t border-white/10 p-4">
        <p className="truncate px-1 text-xs text-white/40">{userEmail}</p>
        <div className="mt-2.5">
          <SignOutButton />
        </div>
      </div>
    </>
  );
}
