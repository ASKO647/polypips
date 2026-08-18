"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { AccountStatusCard } from "@/components/dashboard/account-status-card";
import {
  DASHBOARD_NAV_ITEMS,
  DASHBOARD_RESOURCE_ITEMS,
  type DashboardNavItem,
} from "@/lib/data/dashboard-nav";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";
import { cn } from "@/lib/utils";

export function SidebarNavContent({
  userEmail,
  subscription,
  analysesToday,
  onNavigate,
}: {
  userEmail: string;
  subscription: SubscriptionRow | null;
  analysesToday: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const renderLink = (item: DashboardNavItem) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
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
        {item.label}
      </Link>
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
        <AccountStatusCard subscription={subscription} analysesToday={analysesToday} />
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
