"use client";

import { useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";
import { DashboardBottomNav } from "@/components/dashboard/dashboard-bottom-nav";
import { DashboardThemeProvider, useDashboardTheme } from "@/providers/dashboard-theme-provider";
import { CurrencyProvider, type CurrencyCode } from "@/providers/currency-provider";
import { isCancelledSubscription, type SubscriptionRow } from "@/lib/supabase/subscriptions";
import type { NotificationItem } from "@/lib/data/notifications";

function DashboardShellInner({
  userEmail,
  displayName,
  avatarUrl,
  subscription,
  trialEndsAt,
  notifications,
  children,
}: {
  userEmail: string;
  displayName: string;
  avatarUrl: string | null;
  subscription: SubscriptionRow | null;
  trialEndsAt: string | null;
  notifications: NotificationItem[];
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useDashboardTheme();
  const pathname = usePathname();

  // Only the sidebar, header, profile menu, Settings, and the Dashboard
  // overview have been converted to the real light/dark theme so far — the
  // rest of the dashboard (Sport, Coach, Stats, Smart Wallet, Markets,
  // Analyse IA) still uses hardcoded dark-mode styling
  // (text-white, bg-white/[…]) designed against a permanently dark canvas.
  // Pin `main`'s theme scope to dark on those routes so their un-converted
  // text stays legible regardless of the user's chosen theme, until they
  // get their own dedicated conversion pass.
  const isCoreThemedRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/settings");
  const mainTheme = isCoreThemedRoute ? theme : "dark";

  return (
    <div data-dashboard-theme={theme} className="flex min-h-screen bg-dash-bg text-dash-text">
      <DashboardSidebar subscription={subscription} />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          menuOpen={mobileMenuOpen}
          onMenuToggle={() => setMobileMenuOpen((v) => !v)}
          notifications={notifications}
          subscription={subscription}
          cancelled={isCancelledSubscription(subscription)}
          trialEndsAt={trialEndsAt}
          userEmail={userEmail}
          displayName={displayName}
          avatarUrl={avatarUrl}
        />
        <main
          data-dashboard-theme={mainTheme}
          className="flex-1 bg-dash-bg px-5 py-6 pb-[calc(72px+env(safe-area-inset-bottom))] text-dash-text lg:px-8 lg:py-8 lg:pb-8"
        >
          {children}
        </main>
      </div>

      <DashboardBottomNav
        onOpenMenu={() => setMobileMenuOpen((v) => !v)}
        menuOpen={mobileMenuOpen}
      />

      <DashboardMobileNav
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        subscription={subscription}
      />
    </div>
  );
}

export function DashboardShell({
  userEmail,
  displayName,
  avatarUrl,
  initialCurrency,
  subscription,
  trialEndsAt,
  notifications,
  children,
}: {
  userEmail: string;
  displayName: string;
  avatarUrl: string | null;
  initialCurrency: CurrencyCode;
  subscription: SubscriptionRow | null;
  trialEndsAt: string | null;
  notifications: NotificationItem[];
  children: React.ReactNode;
}) {
  return (
    <DashboardThemeProvider>
      <CurrencyProvider initialCurrency={initialCurrency}>
        <DashboardShellInner
          userEmail={userEmail}
          displayName={displayName}
          avatarUrl={avatarUrl}
          subscription={subscription}
          trialEndsAt={trialEndsAt}
          notifications={notifications}
        >
          {children}
        </DashboardShellInner>
      </CurrencyProvider>
    </DashboardThemeProvider>
  );
}
