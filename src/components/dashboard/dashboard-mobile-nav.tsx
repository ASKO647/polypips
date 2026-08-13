"use client";

import { X } from "lucide-react";
import { SidebarNavContent } from "@/components/dashboard/sidebar-nav-content";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";

export function DashboardMobileNav({
  open,
  onClose,
  userEmail,
  subscription,
  analysesToday,
}: {
  open: boolean;
  onClose: () => void;
  userEmail: string;
  subscription: SubscriptionRow | null;
  analysesToday: number;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 animate-fade-in bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-y-0 right-0 flex w-[280px] max-w-[80vw] animate-fade-up flex-col overflow-y-auto border-l border-white/10 bg-[#160b0c]">
        <div className="flex h-[72px] shrink-0 items-center justify-between px-5">
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

        <SidebarNavContent
          userEmail={userEmail}
          onNavigate={onClose}
          subscription={subscription}
          analysesToday={analysesToday}
        />
      </div>
    </div>
  );
}
