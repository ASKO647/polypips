"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import { ensureReferralSlug, type ReferralSlugResult } from "@/lib/supabase/user-referrals";

/** Called once from ReferralTab's mount effect — creates this user's
 * referral link lazily, the first time they open the "Inviter et gagner"
 * tab, rather than eagerly for every user at signup. Always returns an
 * explicit { slug, error } pair — never a bare null — so the client can
 * distinguish "still loading" from "failed" instead of getting stuck. */
export async function getOrCreateReferralSlug(): Promise<ReferralSlugResult> {
  const user = await getAuthUser();
  if (!user) {
    return { slug: null, error: "Vous devez être connecté pour générer un lien de parrainage." };
  }

  const supabase = await createClient();
  return ensureReferralSlug(supabase, user.id);
}
