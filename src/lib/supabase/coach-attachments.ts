import type { SupabaseClient } from "@supabase/supabase-js";

export const COACH_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024; // 10 MiB, matches the bucket's own file_size_limit
export const COACH_ATTACHMENT_ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/csv",
] as const;

export type CoachAttachmentKind = "image" | "pdf" | "csv";

const KIND_BY_TYPE: Record<string, CoachAttachmentKind> = {
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "application/pdf": "pdf",
  "text/csv": "csv",
};

export type UploadedCoachAttachment = {
  id: string;
  fileName: string;
  kind: CoachAttachmentKind;
};

export class CoachAttachmentError extends Error {
  code: "daily_limit_reached" | "invalid_file" | "upload_failed";
  constructor(code: CoachAttachmentError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

/** Client-side pre-check only, for immediate feedback — the bucket's own
 * file_size_limit/allowed_mime_types (set in the coach_assistant_upgrade
 * migration) and register_coach_attachment's daily cap are what actually
 * enforce this server-side; this function never substitutes for either. */
export function validateCoachAttachmentFile(file: File): string | null {
  if (!COACH_ATTACHMENT_ALLOWED_TYPES.includes(file.type as (typeof COACH_ATTACHMENT_ALLOWED_TYPES)[number])) {
    return "Format non supporté. Utilisez une image (PNG/JPEG/WebP), un PDF ou un CSV.";
  }
  if (file.size > COACH_ATTACHMENT_MAX_BYTES) {
    return "Fichier trop lourd (10 Mo maximum).";
  }
  return null;
}

/** Uploads to the user's own folder (coach-attachments/{userId}/...) —
 * required for the bucket's own RLS path-ownership policy — then
 * registers the row via the SECURITY DEFINER RPC, the one place the
 * 5-per-day cap is actually enforced (see the migration's own comment).
 * On a cap rejection, the just-uploaded storage object is deleted again
 * so it doesn't linger as an orphan nobody can ever reference. */
export async function uploadCoachAttachment(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<UploadedCoachAttachment> {
  const validationError = validateCoachAttachmentFile(file);
  if (validationError) throw new CoachAttachmentError("invalid_file", validationError);

  const kind = KIND_BY_TYPE[file.type];
  const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const { error: uploadError } = await supabase.storage
    .from("coach-attachments")
    .upload(path, file, { contentType: file.type });
  if (uploadError) {
    throw new CoachAttachmentError("upload_failed", uploadError.message);
  }

  const { data, error: registerError } = await supabase.rpc("register_coach_attachment", {
    p_storage_path: path,
    p_file_name: file.name,
    p_mime_type: file.type,
    p_kind: kind,
    p_size_bytes: file.size,
  });

  if (registerError || !data) {
    await supabase.storage.from("coach-attachments").remove([path]);
    if (registerError?.message?.includes("daily_attachment_limit_reached")) {
      throw new CoachAttachmentError(
        "daily_limit_reached",
        "Vous avez atteint la limite de 5 pièces jointes par jour. Réessayez demain."
      );
    }
    throw new CoachAttachmentError(
      "upload_failed",
      registerError?.message ?? "La pièce jointe n'a pas pu être enregistrée."
    );
  }

  return { id: data.id as string, fileName: file.name, kind };
}
