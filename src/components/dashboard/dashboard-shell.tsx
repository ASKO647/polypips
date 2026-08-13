"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";

export function DashboardShell({
  userEmail,
  subscription,
  analysesToday,
  children,
}: {
  userEmail: string;
  subscription: SubscriptionRow | null;
  analysesToday: number;
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#160b0c]">
      <DashboardSidebar
        userEmail={userEmail}
        subscription={subscription}
        analysesToday={analysesToday}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          menuOpen={mobileMenuOpen}
          onMenuToggle={() => setMobileMenuOpen((v) => !v)}
        />
        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      <DashboardMobileNav
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        userEmail={userEmail}
        subscription={subscription}
        analysesToday={analysesToday}
      />
    </div>
  );
}
