import { createAdminClient } from "@/lib/supabase/admin";

export type OwnerUserRow = {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  plan: string | null;
  status: string | null;
  currentPeriodEnd: string | null;
  analysesCount: number;
};

export type OwnerUserStatusFilter =
  | "all"
  | "decouverte"
  | "pro"
  | "active"
  | "canceled"
  | "expired";

type RawUserRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  plan: string | null;
  status: string | null;
  current_period_end: string | null;
  analyses_count: number | string;
  total_count: number | string;
};

/** Paginated, searched and filtered entirely in SQL (see owner_list_users
 * in the owner-console migration) — never pulls the full user table into
 * app memory. auth.users isn't reachable via PostgREST directly, hence the
 * RPC to a SECURITY DEFINER function instead of a plain .from() query. */
export async function fetchOwnerUsers({
  search,
  status = "all",
  page = 1,
  pageSize = 25,
}: {
  search?: string;
  status?: OwnerUserStatusFilter;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: OwnerUserRow[]; total: number }> {
  const supabase = createAdminClient();
  const offset = (Math.max(page, 1) - 1) * pageSize;

  const { data, error } = await supabase.rpc("owner_list_users", {
    p_search: search?.trim() || null,
    p_status: status,
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) {
    console.error("[owner-users] owner_list_users failed", error);
    return { rows: [], total: 0 };
  }

  const raw = (data ?? []) as RawUserRow[];

  return {
    rows: raw.map((row) => ({
      id: row.id,
      email: row.email,
      createdAt: row.created_at,
      lastSignInAt: row.last_sign_in_at,
      plan: row.plan,
      status: row.status,
      currentPeriodEnd: row.current_period_end,
      analysesCount: Number(row.analyses_count ?? 0),
    })),
    total: raw.length > 0 ? Number(raw[0]!.total_count) : 0,
  };
}

export async function fetchOwnerUsersSummary(
  since?: Date
): Promise<{ totalUsers: number; newUsers: number }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("owner_users_summary", {
    p_since: since ? since.toISOString() : null,
  });

  const row = (data ?? [])[0] as { total_users: number; new_users: number } | undefined;
  if (error || !row) {
    console.error("[owner-users] owner_users_summary failed", error);
    return { totalUsers: 0, newUsers: 0 };
  }
  return { totalUsers: Number(row.total_users), newUsers: Number(row.new_users) };
}
