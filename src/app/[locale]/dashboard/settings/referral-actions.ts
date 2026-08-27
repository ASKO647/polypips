"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import { ensureReferralSlug } from "@/lib/supabase/user-referrals";

/** Called once from ReferralTab's mount effect — creates this user's
 * referral link lazily, the first time they open the "Inviter et gagner"
 * tab, rather than eagerly for every user at signup. */
export async function getOrCreateReferralSlug(): Promise<string | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  return ensureReferralSlug(supabase, user.id);
}
