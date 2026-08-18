import type { Metadata } from "next";
import { CommunityFlow } from "@/components/dashboard/community/community-flow";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import {
  fetchSubscription,
  hasActiveAccess,
  isCancelledSubscription,
} from "@/lib/supabase/subscriptions";
import { fetchDiscoverGroups, fetchMyGroups } from "@/lib/supabase/groups";

export const metadata: Metadata = {
  title: "Communauté — Polypips",
};

export default async function CommunityPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    return (
      <CommunityFlow
        initialDiscoverGroups={[]}
        initialMyGroups={[]}
        hasCommunityAccess={false}
        cancelled={false}
      />
    );
  }

  const [subscription, discoverGroups, myGroups] = await Promise.all([
    fetchSubscription(supabase),
    fetchDiscoverGroups(supabase, user.id),
    fetchMyGroups(supabase, user.id),
  ]);

  return (
    <CommunityFlow
      initialDiscoverGroups={discoverGroups}
      initialMyGroups={myGroups}
      hasCommunityAccess={hasActiveAccess(subscription)}
      cancelled={isCancelledSubscription(subscription)}
    />
  );
}
