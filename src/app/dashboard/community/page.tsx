import type { Metadata } from "next";
import { CommunityFlow } from "@/components/dashboard/community/community-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription, hasActiveAccess } from "@/lib/supabase/subscriptions";
import { fetchDiscoverGroups, fetchMyGroups } from "@/lib/supabase/groups";

export const metadata: Metadata = {
  title: "Communauté — Polypips",
};

export default async function CommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <CommunityFlow
        initialDiscoverGroups={[]}
        initialMyGroups={[]}
        hasCommunityAccess={false}
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
    />
  );
}
