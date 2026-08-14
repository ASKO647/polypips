import type { SupabaseClient } from "@supabase/supabase-js";
import type { GroupMemberStatus, GroupSummary } from "@/lib/data/community";

const RPC_ERROR_MESSAGES: Record<string, string> = {
  authentication_required: "Connectez-vous pour continuer.",
  community_access_required: "La Communauté est réservée aux abonnés Pro et Pro+.",
  invalid_name: "Donnez un nom à votre groupe.",
  group_not_found: "Ce groupe n'existe plus.",
  not_authorized: "Seul le propriétaire du groupe peut faire ça.",
  request_not_found: "Cette demande n'existe plus ou a déjà été traitée.",
  cannot_remove_owner: "Impossible de retirer le propriétaire du groupe.",
};

export class GroupActionError extends Error {
  code: string;
  constructor(code: string) {
    super(RPC_ERROR_MESSAGES[code] ?? "Une erreur est survenue.");
    this.code = code;
    this.name = "GroupActionError";
  }
}

/** Postgres wraps a `raise exception 'code'` as a generic error whose
 * `.message` is the raw code string — this pulls it back out so the UI can
 * show a real French message instead of a raw Postgres error. */
function toGroupActionError(error: { message?: string } | null): GroupActionError {
  const code = error?.message?.trim() ?? "unknown";
  return new GroupActionError(code);
}

export async function createGroup(
  supabase: SupabaseClient,
  input: { name: string; description: string; isPrivate: boolean }
): Promise<string> {
  const { data, error } = await supabase.rpc("create_group", {
    group_name: input.name,
    group_description: input.description,
    group_is_private: input.isPrivate,
  });
  if (error || !data) throw toGroupActionError(error);
  return (data as { id: string }).id;
}

export async function joinGroup(supabase: SupabaseClient, groupId: string): Promise<void> {
  const { error } = await supabase.rpc("join_group", { target_group_id: groupId });
  if (error) throw toGroupActionError(error);
}

type FindGroupByCodeRow = {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  is_private: boolean;
  member_count: number;
  created_at: string;
  membership_status: GroupMemberStatus | null;
};

/** find_group_by_code bypasses the groups SELECT policy on purpose — a
 * private group is invisible in "Découvrir" but must still be findable by
 * whoever has its code. Returns null when no group matches (never an
 * error — an unknown code is an expected outcome, not a failure). */
export async function findGroupByCode(
  supabase: SupabaseClient,
  code: string
): Promise<GroupSummary | null> {
  const { data, error } = await supabase.rpc("find_group_by_code", {
    search_code: code,
  });
  if (error) throw toGroupActionError(error);

  const rows = (data ?? []) as FindGroupByCodeRow[];
  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.owner_id,
    isPrivate: row.is_private,
    memberCount: Number(row.member_count),
    createdAt: row.created_at,
    membershipStatus: row.membership_status,
    inviteCode: null,
  };
}

export async function approveMember(
  supabase: SupabaseClient,
  groupId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc("approve_member", {
    target_group_id: groupId,
    target_user_id: userId,
  });
  if (error) throw toGroupActionError(error);
}

export async function rejectMember(
  supabase: SupabaseClient,
  groupId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc("reject_member", {
    target_group_id: groupId,
    target_user_id: userId,
  });
  if (error) throw toGroupActionError(error);
}

export async function removeMember(
  supabase: SupabaseClient,
  groupId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc("remove_member", {
    target_group_id: groupId,
    target_user_id: userId,
  });
  if (error) throw toGroupActionError(error);
}

export async function setGroupPrivacy(
  supabase: SupabaseClient,
  groupId: string,
  isPrivate: boolean
): Promise<void> {
  const { error } = await supabase
    .from("groups")
    .update({ is_private: isPrivate, updated_at: new Date().toISOString() })
    .eq("id", groupId);
  if (error) throw new GroupActionError("unknown");
}

export async function deleteGroup(supabase: SupabaseClient, groupId: string): Promise<void> {
  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) throw new GroupActionError("unknown");
}

export async function sendGroupMessage(
  supabase: SupabaseClient,
  input: { groupId: string; userId: string; content: string; imageUrl?: string | null }
): Promise<void> {
  const { error } = await supabase.from("group_messages").insert({
    group_id: input.groupId,
    user_id: input.userId,
    content: input.content,
    image_url: input.imageUrl ?? null,
  });
  if (error) throw new GroupActionError("unknown");
}

export async function reportMessage(
  supabase: SupabaseClient,
  messageId: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from("group_message_reports")
    .insert({ message_id: messageId, reason });
  if (error) throw new GroupActionError("unknown");
}

export const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
export const COMMUNITY_IMAGES_BUCKET = "community-images";

export class ImageUploadError extends Error {}

/** Uploads under "{groupId}/{userId}/..." — the exact path shape the
 * storage.objects RLS policies in the migration parse to authorize
 * reads/writes, so this convention can't drift from the SQL side. */
export async function uploadGroupImage(
  supabase: SupabaseClient,
  input: { groupId: string; userId: string; file: File }
): Promise<string> {
  if (!input.file.type.startsWith("image/")) {
    throw new ImageUploadError("Seules les images sont acceptées.");
  }
  if (input.file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new ImageUploadError("Image trop lourde (8 Mo maximum).");
  }

  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${input.groupId}/${input.userId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(COMMUNITY_IMAGES_BUCKET)
    .upload(path, input.file, { contentType: input.file.type });

  if (error) throw new ImageUploadError("Échec de l'envoi de l'image.");
  return path;
}

/** community-images is a private bucket (RLS-gated per group visibility),
 * so rendering an attached photo needs a short-lived signed URL rather than
 * a public one. */
export async function getSignedImageUrl(
  supabase: SupabaseClient,
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(COMMUNITY_IMAGES_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}
