"use server";

import { requireOwnerUser } from "@/lib/supabase/owner";
import { logOwnerEvent } from "@/lib/supabase/owner-audit";
import { signOutOwnerEverywhere } from "@/lib/supabase/owner-security";

/** Re-checks OWNER on the server action itself (not just relying on the
 * layout that rendered the button) — a Server Action is its own request
 * boundary, so it gets its own "session valid → authenticated → OWNER →
 * sinon refus" check rather than trusting the page that called it. */
export async function disconnectAllOwnerSessions(): Promise<{ error: string | null }> {
  const owner = await requireOwnerUser();
  if (!owner) {
    return { error: "unauthorized" };
  }

  const { error } = await signOutOwnerEverywhere(owner.id);
  await logOwnerEvent({
    event: "owner_disconnect_all_sessions",
    result: error ? "failure" : "success",
    userId: owner.id,
    email: owner.email,
  });
  return { error };
}
