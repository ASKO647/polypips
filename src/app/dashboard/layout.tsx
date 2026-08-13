import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import { countAnalysesToday } from "@/lib/supabase/analyses";
import { fetchSubscription } from "@/lib/supabase/subscriptions";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [subscription, analysesToday] = await Promise.all([
    fetchSubscription(supabase),
    countAnalysesToday(supabase, user.id),
  ]);

  return (
    <DashboardShell
      userEmail={user.email ?? ""}
      subscription={subscription}
      analysesToday={analysesToday}
    >
      {children}
    </DashboardShell>
  );
}
