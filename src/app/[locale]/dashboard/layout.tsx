import { redirect } from "@/i18n/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { fetchSubscription, getTrialEndsAt } from "@/lib/supabase/subscriptions";
import { fetchNotifications } from "@/lib/supabase/notifications";
import { fetchCreditBalance } from "@/lib/supabase/credits";
import { fetchUserSettings } from "@/lib/supabase/user-settings";
import type { CurrencyCode } from "@/providers/currency-provider";

export default async function DashboardLayout({
  children,
  params,
}: LayoutProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const [subscription, notifications, creditBalance, settings] = await Promise.all([
    fetchSubscription(supabase),
    fetchNotifications(supabase),
    fetchCreditBalance(supabase),
    fetchUserSettings(supabase),
  ]);

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    "";
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;
  const currency = (user.user_metadata?.currency as CurrencyCode | undefined) ?? "EUR";

  return (
    <DashboardShell
      userId={user.id}
      userEmail={user.email ?? ""}
      displayName={displayName}
      avatarUrl={avatarUrl}
      initialCurrency={currency}
      initialThemeChoice={settings.themeChoice}
      resumeLastSession={settings.resumeLastSession}
      subscription={subscription}
      trialEndsAt={getTrialEndsAt(subscription)}
      notifications={settings.notificationsAppEnabled ? notifications : []}
      creditBalance={creditBalance}
    >
      {children}
    </DashboardShell>
  );
}
