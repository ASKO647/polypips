import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

type OwnerAuditEvent = {
  event: string;
  result: "granted" | "denied" | "success" | "failure";
  userId?: string | null;
  email?: string | null;
  detail?: Record<string, unknown>;
};

/** Best-effort request IP from the standard forwarding header — accurate
 * only insofar as the hosting platform's proxy sets it correctly, which
 * can't be verified from application code alone. */
async function requestIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0]!.trim() : null;
}

/** Writes to public.admin_audit_log via the service-role client (the only
 * writer — see the table's RLS, which has no policy for anon/authenticated
 * at all). Failures here are logged but never thrown: a broken audit
 * write must not be able to take down the owner console itself. */
export async function logOwnerEvent({
  event,
  result,
  userId = null,
  email = null,
  detail = {},
}: OwnerAuditEvent) {
  try {
    const ip = await requestIp();
    const supabase = createAdminClient();
    const { error } = await supabase.from("admin_audit_log").insert({
      event,
      result,
      user_id: userId,
      email,
      ip,
      detail,
    });
    if (error) {
      console.error("[owner-audit] insert failed", error);
    }
  } catch (error) {
    console.error("[owner-audit] logging failed", error);
  }
}
