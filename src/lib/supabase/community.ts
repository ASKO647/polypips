import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CommunityGroupView,
  CommunityMessage,
  FoundCommunityGroup,
  MyCommunityGroup,
  PublicCommunityGroup,
} from "@/lib/data/community";

/** Everything in this file either reads a single RLS-protected table
 * directly (fetchPublicGroups, fetchMessages — both gated by a single
 * function-backed policy, see the migration's file comment) or calls one
 * of the SECURITY DEFINER RPCs that serve a composite/mutating operation
 * in one round trip. Nothing here composes a read via a PostgREST
 * embedded/joined select across two RLS-protected tables — that's the
 * one pattern this rebuild specifically avoids. */

export async function fetchPublicGroups(supabase: SupabaseClient): Promise<PublicCommunityGroup[]> {
  const { data, error } = await supabase
    .from("community_groups")
    .select("id, name, description, avatar_url, created_at")
    .eq("is_private", false)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    avatarUrl: row.avatar_url as string | null,
    createdAt: row.created_at as string,
  }));
}

export async function fetchMyGroups(supabase: SupabaseClient): Promise<MyCommunityGroup[]> {
  const { data, error } = await supabase.rpc("community_list_my_groups");
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    avatarUrl: row.avatar_url as string | null,
    isPrivate: row.is_private as boolean,
    inviteCode: row.invite_code as string | null,
    memberRole: row.member_role as MyCommunityGroup["memberRole"],
    memberStatus: row.member_status as MyCommunityGroup["memberStatus"],
    memberCount: Number(row.member_count ?? 0),
    createdAt: row.created_at as string,
  }));
}

/** Returns null when no group matches the code — a wrong/expired code is
 * a normal outcome here, never surfaced as an error. */
export async function findGroupByCode(
  supabase: SupabaseClient,
  inviteCode: string
): Promise<FoundCommunityGroup | null> {
  const { data, error } = await supabase.rpc("community_find_group_by_code", {
    p_invite_code: inviteCode,
  });
  if (error || !data || data.length === 0) return null;
  const row = data[0] as Record<string, unknown>;
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    avatarUrl: row.avatar_url as string | null,
    isPrivate: row.is_private as boolean,
  };
}

/** Throws on failure (invalid name, no active subscription) — callers
 * must catch and surface the message, never swallow it. */
export async function createGroup(
  supabase: SupabaseClient,
  input: { name: string; description: string; isPrivate: boolean }
): Promise<{ id: string }> {
  const { data, error } = await supabase.rpc("community_create_group", {
    p_name: input.name,
    p_description: input.description,
    p_is_private: input.isPrivate,
  });
  if (error || !data) throw new Error(error?.message ?? "Impossible de créer le groupe.");
  return { id: (data as { id: string }).id };
}

export type JoinResult = { status: "approved" | "pending" };

export async function joinGroup(supabase: SupabaseClient, groupId: string): Promise<JoinResult> {
  const { data, error } = await supabase.rpc("community_join_group", { p_group_id: groupId });
  if (error || !data) throw new Error(error?.message ?? "Impossible de rejoindre ce groupe.");
  const status = (data as { status: string }).status;
  return { status: status === "approved" ? "approved" : "pending" };
}

export async function getGroupView(
  supabase: SupabaseClient,
  groupId: string
): Promise<CommunityGroupView | null> {
  const { data, error } = await supabase.rpc("community_get_group_view", { p_group_id: groupId });
  if (error || !data) return null;
  const raw = data as {
    group: {
      id: string;
      name: string;
      description: string;
      avatarUrl: string | null;
      isPrivate: boolean;
      inviteCode: string | null;
    };
    myMembership: { status: string; role: string } | null;
    isOwner: boolean;
    members: {
      userId: string;
      displayName: string;
      avatarUrl: string | null;
      status: string;
      role: string;
      joinedAt: string;
    }[];
  };
  return raw as unknown as CommunityGroupView;
}

export async function updateGroup(
  supabase: SupabaseClient,
  groupId: string,
  patch: { name?: string; description?: string; isPrivate?: boolean }
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.isPrivate !== undefined) payload.is_private = patch.isPrivate;
  const { error } = await supabase.from("community_groups").update(payload).eq("id", groupId);
  if (error) throw new Error(error.message);
}

export async function deleteGroup(supabase: SupabaseClient, groupId: string): Promise<void> {
  const { error } = await supabase.from("community_groups").delete().eq("id", groupId);
  if (error) throw new Error(error.message);
}

export async function approveMember(supabase: SupabaseClient, groupId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc("community_approve_member", {
    p_group_id: groupId,
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);
}

export async function rejectMember(supabase: SupabaseClient, groupId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc("community_reject_member", {
    p_group_id: groupId,
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);
}

export async function removeMember(supabase: SupabaseClient, groupId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc("community_remove_member", {
    p_group_id: groupId,
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);
}

const MESSAGE_PAGE_SIZE = 100;

export async function fetchMessages(supabase: SupabaseClient, groupId: string): Promise<CommunityMessage[]> {
  const { data, error } = await supabase
    .from("community_messages")
    .select("id, group_id, user_id, content, image_url, created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true })
    .limit(MESSAGE_PAGE_SIZE);
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    groupId: row.group_id as string,
    userId: row.user_id as string,
    content: row.content as string,
    imageUrl: row.image_url as string | null,
    createdAt: row.created_at as string,
  }));
}

export async function sendMessage(
  supabase: SupabaseClient,
  input: { groupId: string; content: string; imageUrl?: string | null }
): Promise<CommunityMessage> {
  const { data, error } = await supabase.rpc("community_send_message", {
    p_group_id: input.groupId,
    p_content: input.content,
    p_image_url: input.imageUrl ?? null,
  });
  if (error || !data) throw new Error(error?.message ?? "Message non envoyé.");
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    userId: row.user_id as string,
    content: row.content as string,
    imageUrl: row.image_url as string | null,
    createdAt: row.created_at as string,
  };
}

export async function reportMessage(
  supabase: SupabaseClient,
  input: { messageId: string; reason: string }
): Promise<void> {
  const { error } = await supabase
    .from("community_reports")
    .insert({ message_id: input.messageId, reason: input.reason });
  if (error) throw new Error(error.message);
}

/** Subscribes to new messages in one group — caller owns the channel's
 * lifecycle (supabase.removeChannel(channel) on cleanup). */
export function subscribeToGroupMessages(
  supabase: SupabaseClient,
  groupId: string,
  onInsert: (message: CommunityMessage) => void
) {
  return supabase
    .channel(`community-messages-${groupId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "community_messages", filter: `group_id=eq.${groupId}` },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        onInsert({
          id: row.id as string,
          groupId: row.group_id as string,
          userId: row.user_id as string,
          content: row.content as string,
          imageUrl: row.image_url as string | null,
          createdAt: row.created_at as string,
        });
      }
    )
    .subscribe();
}

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function validateCommunityImage(file: File): string | null {
  if (!IMAGE_ALLOWED_TYPES.includes(file.type)) {
    return "Format non supporté. Utilisez une image PNG, JPEG ou WebP.";
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return "Image trop lourde (5 Mo maximum).";
  }
  return null;
}

export async function uploadGroupAvatar(
  supabase: SupabaseClient,
  groupId: string,
  file: File
): Promise<string> {
  const validationError = validateCommunityImage(file);
  if (validationError) throw new Error(validationError);

  const extension = EXTENSION_BY_TYPE[file.type] ?? "jpg";
  const path = `avatars/${groupId}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("community-media")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("community-media").getPublicUrl(path);
  const bustedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("community_groups")
    .update({ avatar_url: bustedUrl })
    .eq("id", groupId);
  if (updateError) throw new Error(updateError.message);

  return bustedUrl;
}

export async function uploadMessageImage(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
  file: File
): Promise<string> {
  const validationError = validateCommunityImage(file);
  if (validationError) throw new Error(validationError);

  const extension = EXTENSION_BY_TYPE[file.type] ?? "jpg";
  const path = `messages/${groupId}/${userId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("community-media")
    .upload(path, file, { contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("community-media").getPublicUrl(path);
  return publicUrl;
}
