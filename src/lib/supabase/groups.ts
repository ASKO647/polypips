import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GroupMember,
  GroupMemberStatus,
  GroupMessage,
  GroupSummary,
} from "@/lib/data/community";

type GroupRow = {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  is_private: boolean;
  created_at: string;
};

type MemberRow = {
  id: string;
  group_id: string;
  user_id: string;
  display_name: string;
  status: GroupMemberStatus;
  role: "owner" | "member";
  joined_at: string;
};

type MessageRow = {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
};

function mapMember(row: MemberRow): GroupMember {
  return {
    id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    displayName: row.display_name,
    status: row.status,
    role: row.role,
    joinedAt: row.joined_at,
  };
}

/** Approved-member counts per group, computed separately from the groups
 * query since PostgREST's embedded-resource count can't be filtered by
 * status without also restricting which groups come back. */
async function fetchApprovedMemberCounts(
  supabase: SupabaseClient,
  groupIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (groupIds.length === 0) return counts;

  const { data } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("status", "approved")
    .in("group_id", groupIds);

  for (const row of (data ?? []) as { group_id: string }[]) {
    counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1);
  }
  return counts;
}

async function fetchOwnMembershipStatuses(
  supabase: SupabaseClient,
  userId: string,
  groupIds: string[]
): Promise<Map<string, GroupMemberStatus>> {
  const statuses = new Map<string, GroupMemberStatus>();
  if (groupIds.length === 0) return statuses;

  const { data } = await supabase
    .from("group_members")
    .select("group_id, status")
    .eq("user_id", userId)
    .in("group_id", groupIds);

  for (const row of (data ?? []) as { group_id: string; status: GroupMemberStatus }[]) {
    statuses.set(row.group_id, row.status);
  }
  return statuses;
}

/** "Découvrir": every public group, regardless of the caller's membership
 * — the UI shows "Rejoint" instead of "Rejoindre" when already a member. */
export async function fetchDiscoverGroups(
  supabase: SupabaseClient,
  userId: string | null
): Promise<GroupSummary[]> {
  const { data, error } = await supabase
    .from("groups")
    .select("id, name, description, owner_id, is_private, created_at")
    .eq("is_private", false)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const rows = data as GroupRow[];
  const groupIds = rows.map((r) => r.id);
  const [counts, ownStatuses] = await Promise.all([
    fetchApprovedMemberCounts(supabase, groupIds),
    userId ? fetchOwnMembershipStatuses(supabase, userId, groupIds) : Promise.resolve(new Map()),
  ]);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.owner_id,
    isPrivate: row.is_private,
    memberCount: counts.get(row.id) ?? 0,
    createdAt: row.created_at,
    membershipStatus: ownStatuses.get(row.id) ?? null,
  }));
}

/** "Mes groupes": groups the caller owns or is an approved member of. */
export async function fetchMyGroups(
  supabase: SupabaseClient,
  userId: string
): Promise<GroupSummary[]> {
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, status")
    .eq("user_id", userId)
    .eq("status", "approved");

  const groupIds = ((memberships ?? []) as { group_id: string }[]).map((m) => m.group_id);
  if (groupIds.length === 0) return [];

  const { data, error } = await supabase
    .from("groups")
    .select("id, name, description, owner_id, is_private, created_at")
    .in("id", groupIds)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const rows = data as GroupRow[];
  const counts = await fetchApprovedMemberCounts(supabase, groupIds);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.owner_id,
    isPrivate: row.is_private,
    memberCount: counts.get(row.id) ?? 0,
    createdAt: row.created_at,
    membershipStatus: "approved",
  }));
}

export async function fetchGroupById(
  supabase: SupabaseClient,
  groupId: string
): Promise<GroupSummary | null> {
  const { data, error } = await supabase
    .from("groups")
    .select("id, name, description, owner_id, is_private, created_at")
    .eq("id", groupId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as GroupRow;
  const counts = await fetchApprovedMemberCounts(supabase, [row.id]);

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.owner_id,
    isPrivate: row.is_private,
    memberCount: counts.get(row.id) ?? 0,
    createdAt: row.created_at,
    membershipStatus: null,
  };
}

export async function fetchOwnMembership(
  supabase: SupabaseClient,
  groupId: string,
  userId: string
): Promise<GroupMember | null> {
  const { data, error } = await supabase
    .from("group_members")
    .select("id, group_id, user_id, display_name, status, role, joined_at")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapMember(data as MemberRow);
}

/** Full roster (any status) — only meaningfully readable in full by the
 * group owner per RLS; an approved non-owner member's query still works
 * but only returns approved rows for anyone but themselves and the owner. */
export async function fetchGroupMembers(
  supabase: SupabaseClient,
  groupId: string
): Promise<GroupMember[]> {
  const { data, error } = await supabase
    .from("group_members")
    .select("id, group_id, user_id, display_name, status, role, joined_at")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (error || !data) return [];
  return (data as MemberRow[]).map(mapMember);
}

export async function fetchGroupMessages(
  supabase: SupabaseClient,
  groupId: string,
  limit = 50
): Promise<GroupMessage[]> {
  const { data, error } = await supabase
    .from("group_messages")
    .select("id, group_id, user_id, content, image_url, created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const rows = (data as MessageRow[]).slice().reverse();
  const members = await fetchGroupMembers(supabase, groupId);
  const nameByUserId = new Map(members.map((m) => [m.userId, m.displayName]));

  return rows.map((row) => ({
    id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    displayName: nameByUserId.get(row.user_id) ?? "Membre",
    content: row.content,
    imageUrl: row.image_url,
    createdAt: row.created_at,
  }));
}
