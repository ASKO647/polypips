"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { isResumableDashboardRoute } from "@/lib/dashboard-resumable-routes";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";
import { DashboardBottomNav } from "@/components/dashboard/dashboard-bottom-nav";
import { DashboardThemeProvider, useDashboardTheme } from "@/providers/dashboard-theme-provider";
import { CurrencyProvider, type CurrencyCode } from "@/providers/currency-provider";
import { isCancelledSubscription, type SubscriptionRow } from "@/lib/supabase/subscriptions";
import type { NotificationItem } from "@/lib/data/notifications";

function DashboardShellInner({
  userId,
  userEmail,
  displayName,
  avatarUrl,
  subscription,
  trialEndsAt,
  notifications,
  creditBalance,
  resumeLastSession,
  children,
}: {
  userId: string;
  userEmail: string;
  displayName: string;
  avatarUrl: string | null;
  subscription: SubscriptionRow | null;
  trialEndsAt: string | null;
  notifications: NotificationItem[];
  creditBalance: number;
  resumeLastSession: boolean;
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useDashboardTheme();
  const pathname = usePathname();

  // Backs the "Reprendre ma dernière session" preference (Préférences tab):
  // remembers the last route visited on this browser so the next
  // /dashboard root load can offer to resume it. Deliberately per-browser
  // (only the on/off choice itself is synced cross-device via
  // user_settings) — there's no meaningful cross-device notion of "last
  // open tab". Only ever writes a route from the resumable allow-list —
  // never Paramètres, l'abonnement, ou une route qui n'existe plus —
  // since DashboardEntryRedirect trusts this value without re-checking
  // anything beyond "is it still in the allow-list".
  useEffect(() => {
    if (!resumeLastSession) return;
    if (!isResumableDashboardRoute(pathname)) return;
    try {
      window.localStorage.setItem("polypips-last-path", pathname);
    } catch {
      // Best-effort only.
    }
  }, [resumeLastSession, pathname]);
  const isImmersiveRoute = pathname === "/dashboard" || pathname === "/dashboard/analyse-ia" || pathname === "/dashboard/markets" || pathname === "/dashboard/copy-trading" || pathname === "/dashboard/sports" || pathname === "/dashboard/sports/selection" || pathname === "/dashboard/sports/mes-analyses" || pathname === "/dashboard/trading" || pathname === "/dashboard/trading/selection" || pathname === "/dashboard/trading/mes-analyses" || pathname === "/dashboard/settings";

  // Only the sidebar, header, profile menu, Settings, and the Dashboard
  // overview have been converted to the real light/dark theme so far — the
  // rest of the dashboard (Sport, Stats, Smart Wallet, Markets,
  // Analyse IA) still uses hardcoded dark-mode styling
  // (text-white, bg-white/[…]) designed against a permanently dark canvas.
  // Pin `main`'s theme scope to dark on those routes so their un-converted
  // text stays legible regardless of the user's chosen theme, until they
  // get their own dedicated conversion pass.
  const isCoreThemedRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/settings");
  const mainTheme = isCoreThemedRoute ? theme : "dark";

  return (
    <div data-dashboard-theme={theme} className="flex min-h-dvh bg-dash-bg text-dash-text">
      {!isImmersiveRoute && <DashboardSidebar subscription={subscription} userId={userId} creditBalance={creditBalance} />}

      <div className="flex min-w-0 flex-1 flex-col">
        {!isImmersiveRoute && <DashboardHeader
          menuOpen={mobileMenuOpen}
          onMenuToggle={() => setMobileMenuOpen((v) => !v)}
          notifications={notifications}
          subscription={subscription}
          cancelled={isCancelledSubscription(subscription)}
          trialEndsAt={trialEndsAt}
          userEmail={userEmail}
          displayName={displayName}
          avatarUrl={avatarUrl}
          creditBalance={creditBalance}
        />}
        <main
          data-dashboard-theme={mainTheme}
          className={isImmersiveRoute ? "min-h-0 flex-1 bg-white text-[#171012]" : "flex-1 bg-dash-bg px-5 py-6 pb-[calc(72px+var(--safe-bottom))] text-dash-text lg:px-8 lg:py-8 lg:pb-8"}
        >
          {children}
        </main>
      </div>

      {!isImmersiveRoute && <DashboardBottomNav
        onOpenMenu={() => setMobileMenuOpen((v) => !v)}
        menuOpen={mobileMenuOpen}
      />}

      {!isImmersiveRoute && <DashboardMobileNav
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        subscription={subscription}
        userId={userId}
        creditBalance={creditBalance}
      />}
    </div>
  );
}

export function DashboardShell({
  userId,
  userEmail,
  displayName,
  avatarUrl,
  initialCurrency,
  initialThemeChoice,
  resumeLastSession,
  subscription,
  trialEndsAt,
  notifications,
  creditBalance,
  children,
}: {
  userId: string;
  userEmail: string;
  displayName: string;
  avatarUrl: string | null;
  initialCurrency: CurrencyCode;
  initialThemeChoice: "light" | "dark" | "system";
  resumeLastSession: boolean;
  subscription: SubscriptionRow | null;
  trialEndsAt: string | null;
  notifications: NotificationItem[];
  creditBalance: number;
  children: React.ReactNode;
}) {
  return (
    <DashboardThemeProvider initialThemeChoice={initialThemeChoice}>
      <CurrencyProvider initialCurrency={initialCurrency}>
        <DashboardShellInner
          userId={userId}
          userEmail={userEmail}
          displayName={displayName}
          avatarUrl={avatarUrl}
          subscription={subscription}
          trialEndsAt={trialEndsAt}
          notifications={notifications}
          creditBalance={creditBalance}
          resumeLastSession={resumeLastSession}
        >
          {children}
        </DashboardShellInner>
      </CurrencyProvider>
    </DashboardThemeProvider>
  );
}
