import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GroupViewFlow } from "@/components/dashboard/community/group-view-flow";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { fetchSubscription, hasActiveAccess, isCancelledSubscription } from "@/lib/supabase/subscriptions";
import { fetchMessages, getGroupView } from "@/lib/supabase/community";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ groupId: string }>;
}): Promise<Metadata> {
  const { groupId } = await params;
  const supabase = await createClient();
  const view = await getGroupView(supabase, groupId);
  return { title: view ? `${view.group.name} — Communauté — Polypips` : "Communauté — Polypips" };
}

export default async function CommunityGroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) notFound();

  const [subscription, view] = await Promise.all([
    fetchSubscription(supabase),
    getGroupView(supabase, groupId),
  ]);

  // getGroupView() returns null only when the group itself doesn't exist
  // — a real 404. A private group the caller hasn't joined (or is still
  // pending on) still returns a real payload so the page can render
  // "Demande envoyée" instead — see that RPC's own comment for why this
  // distinction is the whole point of this rebuild.
  if (!view) notFound();

  const isApprovedMember = view.isOwner || view.myMembership?.status === "approved";
  const messages = isApprovedMember ? await fetchMessages(supabase, groupId) : [];

  return (
    <GroupViewFlow
      groupId={groupId}
      initialView={view}
      initialMessages={messages}
      currentUserId={user.id}
      hasActiveSubscription={hasActiveAccess(subscription)}
      cancelled={isCancelledSubscription(subscription)}
    />
  );
}
