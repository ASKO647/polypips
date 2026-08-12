"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { DASHBOARD_NAV_ITEMS } from "@/lib/data/dashboard-nav";
import { cn } from "@/lib/utils";

export function DashboardSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[#160b0c] lg:flex">
      <Link
        href="/dashboard"
        className="flex h-[72px] items-center gap-2 px-6"
        aria-label="Polypips — tableau de bord"
      >
        <Image
          src="/polypips-mark.png"
          alt=""
          width={290}
          height={322}
          className="h-7 w-auto"
        />
        <span className="font-display text-lg font-bold tracking-tight text-white">
          POLYPIPS
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-4 py-2">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <p className="truncate px-1 text-xs text-white/40">{userEmail}</p>
        <div className="mt-2.5">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
