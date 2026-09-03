"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { SidebarNavContent } from "@/components/dashboard/sidebar-nav-content";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";

export function DashboardMobileNav({
  open,
  onClose,
  subscription,
}: {
  open: boolean;
  onClose: () => void;
  subscription: SubscriptionRow | null;
}) {
  const t = useTranslations("Dashboard.MobileNav");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 animate-fade-in bg-dash-overlay"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-y-0 right-0 flex w-[280px] max-w-[80vw] animate-fade-up flex-col overflow-y-auto border-l border-dash-border bg-dash-bg pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex h-[72px] shrink-0 items-center justify-between px-5">
          <span className="font-display text-base font-bold text-dash-text">{t("title")}</span>
          <button
            type="button"
            aria-label={t("closeAriaLabel")}
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-dash-border bg-dash-surface-alt text-dash-text-secondary transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <SidebarNavContent onNavigate={onClose} subscription={subscription} />
      </div>
    </div>
  );
}
