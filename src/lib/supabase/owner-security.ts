import { createAdminClient } from "@/lib/supabase/admin";

export type OwnerAuditLogRow = {
  id: string;
  event: string;
  result: "granted" | "denied" | "success" | "failure";
  email: string | null;
  ip: string | null;
  detail: Record<string, unknown>;
  createdAt: string;
};

type RawAuditRow = {
  id: string;
  event: string;
  result: "granted" | "denied" | "success" | "failure";
  email: string | null;
  ip: string | null;
  detail: Record<string, unknown>;
  created_at: string;
};

/** Paginated read of the owner console's own access/action trail — powers
 * both Logs (full feed) and Security (recent auth events only). */
export async function fetchOwnerAuditLog({
  page = 1,
  pageSize = 30,
  eventPrefix,
}: {
  page?: number;
  pageSize?: number;
  eventPrefix?: string;
}): Promise<{ rows: OwnerAuditLogRow[]; total: number }> {
  const supabase = createAdminClient();
  const offset = (Math.max(page, 1) - 1) * pageSize;

  let query = supabase
    .from("admin_audit_log")
    .select("id, event, result, email, ip, detail, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (eventPrefix) {
    query = query.like("event", `${eventPrefix}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("[owner-security] audit log fetch failed", error);
    return { rows: [], total: 0 };
  }

  const raw = (data ?? []) as RawAuditRow[];
  return {
    rows: raw.map((r) => ({
      id: r.id,
      event: r.event,
      result: r.result,
      email: r.email,
      ip: r.ip,
      detail: r.detail,
      createdAt: r.created_at,
    })),
    total: count ?? 0,
  };
}

/** Force-signs the OWNER account out everywhere ('global' scope revokes
 * every refresh token, not just the current session) — used by the
 * Security page's "Déconnecter toutes les sessions" action. Uses the
 * admin API (service role), the same mechanism Supabase's own dashboard
 * uses for this, not a custom session store. */
export async function signOutOwnerEverywhere(userId: string): Promise<{ error: string | null }> {
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.signOut(userId, "global");
  return { error: error?.message ?? null };
}
