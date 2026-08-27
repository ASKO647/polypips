"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerUser } from "@/lib/supabase/owner";
import { logOwnerEvent } from "@/lib/supabase/owner-audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { OWNER_BASE_PATH } from "@/lib/owner-path";

const BASE = `${OWNER_BASE_PATH}/referrals`;

/** Manual-only, as specced — no automatic payout. Same shape as the
 * influencer console's markCommissionPaid. */
export async function markReferralCommissionPaid(referralId: string): Promise<void> {
  const owner = await requireOwnerUser();
  if (!owner) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("user_referrals")
    .update({ commission_status: "paid" })
    .eq("id", referralId);

  await logOwnerEvent({
    event: "owner_referral_commission_marked_paid",
    result: error ? "failure" : "success",
    userId: owner.id,
    email: owner.email,
    detail: { referralId, error: error?.message },
  });

  revalidatePath(BASE);
}
