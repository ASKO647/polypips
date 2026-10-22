"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { daysRemainingFrom, planPillLabel } from "@/lib/plan-pill";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";

export type ProfileMenuPlacement = "header" | "sidebar";

type DashboardProfileMenuContextValue = {
  email: string;
  displayName: string;
  planLabel: string;
  creditBalance: number;
  openPlacement: ProfileMenuPlacement | null;
  setOpenPlacement: (placement: ProfileMenuPlacement | null) => void;
};

const DashboardProfileMenuContext = createContext<DashboardProfileMenuContextValue | null>(null);

/** Feeds the profile dropdown (ProfileMenu) wherever it is mounted outside
 * DashboardHeader — the immersive chrome's header avatar and sidebar user
 * block don't otherwise have the plan label / credit balance in scope, and
 * this also arbitrates which single placement ("header" | "sidebar") may
 * be open at once across however many ProfileMenu instances are mounted on
 * the current page. */
export function DashboardProfileMenuProvider({
  email,
  displayName,
  subscription,
  cancelled,
  trialEndsAt,
  creditBalance,
  children,
}: {
  email: string;
  displayName: string;
  subscription: SubscriptionRow | null;
  cancelled: boolean;
  trialEndsAt: string | null;
  creditBalance: number;
  children: ReactNode;
}) {
  const tPlanPill = useTranslations("Dashboard.Header.planPill");
  const [openPlacement, setOpenPlacement] = useState<ProfileMenuPlacement | null>(null);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!trialEndsAt) return;
    const interval = setInterval(() => setTick((value) => value + 1), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [trialEndsAt]);
  const trialDaysRemaining = useMemo(() => {
    void tick; // forces the hourly recompute above; not itself part of the result
    return trialEndsAt ? daysRemainingFrom(trialEndsAt) : null;
  }, [trialEndsAt, tick]);

  const planLabel = planPillLabel(tPlanPill, subscription, cancelled, trialDaysRemaining);

  const value = useMemo<DashboardProfileMenuContextValue>(
    () => ({ email, displayName, planLabel, creditBalance, openPlacement, setOpenPlacement }),
    [email, displayName, planLabel, creditBalance, openPlacement]
  );

  return <DashboardProfileMenuContext.Provider value={value}>{children}</DashboardProfileMenuContext.Provider>;
}

export function useDashboardProfileMenu(): DashboardProfileMenuContextValue {
  const ctx = useContext(DashboardProfileMenuContext);
  if (!ctx) throw new Error("useDashboardProfileMenu must be used within DashboardProfileMenuProvider");
  return ctx;
}
