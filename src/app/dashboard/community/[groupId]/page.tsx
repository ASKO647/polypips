import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GroupDetailFlow } from "@/components/dashboard/community/group-detail-flow";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import {
  fetchSubscription,
  hasActiveAccess,
  isCancelledSubscription,
} from "@/lib/supabase/subscriptions";
import {
  fetchGroupById,
  fetchGroupMembers,
  fetchGroupMessages,
  fetchOwnMembership,
} from "@/lib/supabase/groups";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/community/[groupId]">): Promise<Metadata> {
  const { groupId } = await params;
  const supabase = await createClient();
  const group = await fetchGroupById(supabase, groupId);
  return { title: group ? `${group.name} — Communauté — Polypips` : "Communauté — Polypips" };
}

export default async function GroupDetailPage({
  params,
}: PageProps<"/dashboard/community/[groupId]">) {
  const { groupId } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();

  const group = await fetchGroupById(supabase, groupId);
  if (!group) notFound();

  if (!user) {
    return (
      <GroupDetailFlow
        group={group}
        currentUserId={null}
        ownMembership={null}
        initialMessages={[]}
        initialMembers={[]}
        hasCommunityAccess={false}
        cancelled={false}
      />
    );
  }

  const [subscription, ownMembership, messages, members] = await Promise.all([
    fetchSubscription(supabase),
    fetchOwnMembership(supabase, groupId, user.id),
    fetchGroupMessages(supabase, groupId),
    fetchGroupMembers(supabase, groupId),
  ]);

  return (
    <GroupDetailFlow
      group={group}
      currentUserId={user.id}
      ownMembership={ownMembership}
      initialMessages={messages}
      initialMembers={members}
      hasCommunityAccess={hasActiveAccess(subscription)}
      cancelled={isCancelledSubscription(subscription)}
    />
  );
}
