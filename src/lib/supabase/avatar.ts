import type { SupabaseClient } from "@supabase/supabase-js";

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
    return "Format non supporté. Utilisez une image PNG, JPEG ou WebP.";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "Image trop lourde (5 Mo maximum).";
  }
  return null;
}

/** Uploads to a per-user folder (avatars/{userId}/avatar.<ext>) so the
 * bucket's RLS policy — writes restricted to storage.foldername(name)[1]
 * matching auth.uid() — can allow it, and upserts so re-uploading replaces
 * the old file instead of accumulating orphaned ones. Throws on any
 * failure (invalid file, storage error, or the auth.updateUser call) —
 * callers must catch and surface it, never swallow it. */
export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string> {
  const validationError = validateAvatarFile(file);
  if (validationError) throw new Error(validationError);

  const extension = EXTENSION_BY_TYPE[file.type] ?? "jpg";
  const path = `${userId}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  // Cache-bust so the new photo shows immediately even though the path
  // (and therefore the URL) is identical to the previous upload.
  const bustedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: bustedUrl },
  });
  if (updateError) throw new Error(updateError.message);

  return bustedUrl;
}

/** Clears `avatar_url` from user_metadata — the storage object itself is
 * left in place (best-effort delete, errors ignored) since its path is
 * keyed by userId and gets overwritten on the next upload anyway; what
 * matters for "Supprimer la photo" to be real is that the app stops
 * pointing at it. Throws only if the metadata update itself fails. */
export async function removeAvatar(supabase: SupabaseClient, userId: string): Promise<void> {
  for (const extension of Object.values(EXTENSION_BY_TYPE)) {
    await supabase.storage.from("avatars").remove([`${userId}/avatar.${extension}`]).catch(() => {});
  }
  const { error } = await supabase.auth.updateUser({ data: { avatar_url: null } });
  if (error) throw new Error(error.message);
}
