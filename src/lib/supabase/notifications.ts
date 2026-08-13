import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationItem } from "@/lib/data/notifications";
import { formatRelativeTime } from "@/lib/supabase/analyses";

type NotificationRow = {
  id: string;
  title: string;
  description: string;
  link_url: string | null;
  read: boolean;
  created_at: string;
};

export async function fetchNotifications(
  supabase: SupabaseClient,
  limit = 20
): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, description, link_url, read, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as NotificationRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    linkUrl: row.link_url,
    timeAgo: formatRelativeTime(row.created_at),
    read: row.read,
  }));
}

export async function markNotificationRead(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}
