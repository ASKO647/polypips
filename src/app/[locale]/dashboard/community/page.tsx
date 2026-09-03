import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CommunityFlow } from "@/components/dashboard/community/community-flow";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { fetchSubscription, hasActiveAccess, isCancelledSubscription } from "@/lib/supabase/subscriptions";
import { fetchMyGroups, fetchPublicGroups } from "@/lib/supabase/community";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Community.Page");
  return { title: t("metaTitle") };
}

export default async function CommunityPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    return <CommunityFlow publicGroups={[]} myGroups={[]} hasActiveSubscription={false} cancelled={false} />;
  }

  const subscription = await fetchSubscription(supabase);

  // Public groups are readable by any authenticated user regardless of
  // plan (RLS has no subscription check on that policy — only creating/
  // joining is gated) — fetched unconditionally so the paywall blur has a
  // real "Découvrir" list underneath it, same pattern as Analyse IA/
  // Marchés: proof the product works, not an empty placeholder.
  const [publicGroups, myGroups] = await Promise.all([
    fetchPublicGroups(supabase),
    fetchMyGroups(supabase),
  ]);

  return (
    <CommunityFlow
      publicGroups={publicGroups}
      myGroups={myGroups}
      hasActiveSubscription={hasActiveAccess(subscription)}
      cancelled={isCancelledSubscription(subscription)}
    />
  );
}
