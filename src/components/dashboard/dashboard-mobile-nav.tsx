"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { DASHBOARD_NAV_ITEMS } from "@/lib/data/dashboard-nav";
import { cn } from "@/lib/utils";

export function DashboardMobileNav({
  open,
  onClose,
  userEmail,
}: {
  open: boolean;
  onClose: () => void;
  userEmail: string;
}) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 animate-fade-in bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-y-0 right-0 flex w-[280px] max-w-[80vw] animate-fade-up flex-col border-l border-white/10 bg-[#160b0c]">
        <div className="flex h-[72px] items-center justify-between px-5">
          <span className="font-display text-base font-bold text-white">Menu</span>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-4">
          {DASHBOARD_NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
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
      </div>
    </div>
  );
}
