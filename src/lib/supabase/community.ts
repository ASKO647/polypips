import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CommunityGroupView,
  CommunityMessage,
  FoundCommunityGroup,
  MessageReaction,
  MessageReactionEmoji,
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

function mapMessageRow(row: Record<string, unknown>): CommunityMessage {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    userId: row.user_id as string,
    content: row.content as string,
    imageUrl: row.image_url as string | null,
    createdAt: row.created_at as string,
  };
}

export async function fetchMessages(supabase: SupabaseClient, groupId: string): Promise<CommunityMessage[]> {
  const { data, error } = await supabase
    .from("community_messages")
    .select("id, group_id, user_id, content, image_url, created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true })
    .limit(MESSAGE_PAGE_SIZE);
  if (error || !data) return [];
  return data.map((row) => mapMessageRow(row as Record<string, unknown>));
}

/** Voice messages were removed from the frontend (product decision) —
 * community_send_message still accepts p_audio_url/p_audio_duration_seconds
 * server-side (defaulted to null) so this call doesn't need a DB migration
 * to keep working; it just never populates them anymore. */
export async function sendMessage(
  supabase: SupabaseClient,
  input: {
    groupId: string;
    content: string;
    imageUrl?: string | null;
  }
): Promise<CommunityMessage> {
  const { data, error } = await supabase.rpc("community_send_message", {
    p_group_id: input.groupId,
    p_content: input.content,
    p_image_url: input.imageUrl ?? null,
  });
  if (error || !data) throw new Error(error?.message ?? "Message non envoyé.");
  return mapMessageRow(data as Record<string, unknown>);
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

export async function fetchReactions(
  supabase: SupabaseClient,
  messageIds: string[]
): Promise<MessageReaction[]> {
  if (messageIds.length === 0) return [];
  const { data, error } = await supabase
    .from("community_message_reactions")
    .select("message_id, user_id, emoji")
    .in("message_id", messageIds);
  if (error || !data) return [];
  return data.map((row) => ({
    messageId: row.message_id as string,
    userId: row.user_id as string,
    emoji: row.emoji as MessageReactionEmoji,
  }));
}

/** Adds the caller's reaction, or removes it if it's already there —
 * the atomic add/remove decision is made server-side (community_toggle_
 * reaction), not by checking client state first, so two rapid clicks
 * can't race into a duplicate insert/delete pair. */
export async function toggleReaction(
  supabase: SupabaseClient,
  messageId: string,
  emoji: MessageReactionEmoji
): Promise<"added" | "removed"> {
  const { data, error } = await supabase.rpc("community_toggle_reaction", {
    p_message_id: messageId,
    p_emoji: emoji,
  });
  if (error) throw new Error(error.message);
  return data as "added" | "removed";
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
      (payload) => onInsert(mapMessageRow(payload.new as Record<string, unknown>))
    )
    .subscribe();
}

/** Subscribes to reaction add/remove events in one group — same channel
 * lifecycle contract as subscribeToGroupMessages (caller must
 * supabase.removeChannel(channel) on cleanup). Requires REPLICA IDENTITY
 * FULL on community_message_reactions (set in its migration) so DELETE
 * payloads still carry group_id/user_id/emoji instead of just the id. */
export function subscribeToGroupReactions(
  supabase: SupabaseClient,
  groupId: string,
  onChange: (event: { type: "insert" | "delete"; reaction: MessageReaction }) => void
) {
  const mapRow = (row: Record<string, unknown>): MessageReaction => ({
    messageId: row.message_id as string,
    userId: row.user_id as string,
    emoji: row.emoji as MessageReactionEmoji,
  });
  return supabase
    .channel(`community-reactions-${groupId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "community_message_reactions",
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => onChange({ type: "insert", reaction: mapRow(payload.new as Record<string, unknown>) })
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "community_message_reactions",
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => onChange({ type: "delete", reaction: mapRow(payload.old as Record<string, unknown>) })
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

/** Group avatars live in the public community-avatars bucket (mirrors
 * lib/supabase/avatar.ts's uploadAvatar exactly — see that bucket's own
 * migration comment for why public read is correct here: a group's
 * avatar is shown in "Découvrir" to non-members deciding whether to
 * join). */
export async function uploadGroupAvatar(
  supabase: SupabaseClient,
  groupId: string,
  file: File
): Promise<string> {
  const validationError = validateCommunityImage(file);
  if (validationError) throw new Error(validationError);

  const extension = EXTENSION_BY_TYPE[file.type] ?? "jpg";
  const path = `${groupId}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("community-avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("community-avatars").getPublicUrl(path);
  const bustedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("community_groups")
    .update({ avatar_url: bustedUrl })
    .eq("id", groupId);
  if (updateError) throw new Error(updateError.message);

  return bustedUrl;
}

// A private group's chat images must stay gated to its approved members,
// so — unlike group avatars — community-media stays a private bucket and
// this mints a signed URL instead of a (non-functional, against a
// private bucket) public one. A long-lived TTL keeps the rest of the
// architecture simple (the URL is stored once in community_messages.
// image_url and just rendered directly, exactly like any other image
// URL) at the cost of the link eventually expiring rather than being
// truly permanent — reasonable for chat history, and mints only succeed
// for someone who already passes the bucket's own community_is_member
// RLS check, so this never grants access beyond what the sender already
// legitimately had.
const MESSAGE_IMAGE_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365;

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

  const { data, error: signError } = await supabase.storage
    .from("community-media")
    .createSignedUrl(path, MESSAGE_IMAGE_SIGNED_URL_TTL_SECONDS);
  if (signError || !data) throw new Error(signError?.message ?? "Image envoyée mais son URL n'a pas pu être générée.");
  return data.signedUrl;
}

