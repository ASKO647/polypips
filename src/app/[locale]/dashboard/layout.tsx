import { redirect } from "@/i18n/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { fetchSubscription, getTrialEndsAt } from "@/lib/supabase/subscriptions";
import { fetchNotifications } from "@/lib/supabase/notifications";

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

  const [subscription, notifications] = await Promise.all([
    fetchSubscription(supabase),
    fetchNotifications(supabase),
  ]);

  return (
    <DashboardShell
      userEmail={user.email ?? ""}
      subscription={subscription}
      trialEndsAt={getTrialEndsAt(subscription)}
      notifications={notifications}
    >
      {children}
    </DashboardShell>
  );
}
