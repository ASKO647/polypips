"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import { createTiktokSubmission } from "@/lib/supabase/tiktok-clips";
import type { TiktokSubmission } from "@/lib/data/tiktok-clips";

export async function submitTiktokClip(
  tiktokUrl: string
): Promise<{ error: string | null; submission: TiktokSubmission | null }> {
  const user = await getAuthUser();
  if (!user) {
    return { error: "Vous devez être connecté pour soumettre une vidéo.", submission: null };
  }

  const supabase = await createClient();
  return createTiktokSubmission(supabase, user.id, tiktokUrl);
}
