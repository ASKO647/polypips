import type { Metadata } from "next";
import { SettingsFlow } from "@/components/dashboard/settings/settings-flow";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Paramètres — Polypips",
};

const MEMBER_SINCE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "";
  const memberSince = user?.created_at
    ? MEMBER_SINCE_FORMATTER.format(new Date(user.created_at))
    : "Date inconnue";

  return <SettingsFlow email={email} memberSince={memberSince} />;
}
