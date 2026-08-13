import type { Metadata } from "next";
import { CommunityFlow } from "@/components/dashboard/community/community-flow";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePlan } from "@/lib/supabase/subscriptions";
import { hasCommunityAccess } from "@/lib/data/pricing";
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

  const plan = await getEffectivePlan(supabase, user.id);
  const [discoverGroups, myGroups] = await Promise.all([
    fetchDiscoverGroups(supabase, user.id),
    fetchMyGroups(supabase, user.id),
  ]);

  return (
    <CommunityFlow
      initialDiscoverGroups={discoverGroups}
      initialMyGroups={myGroups}
      hasCommunityAccess={hasCommunityAccess(plan)}
    />
  );
}
