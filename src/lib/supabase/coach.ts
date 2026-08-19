import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConversationSummary, Message } from "@/lib/data/coach";

type ConversationRow = { id: string; title: string; updated_at: string };

export async function fetchConversationSummaries(
  supabase: SupabaseClient,
  limit = 30
): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from("coach_conversations")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as ConversationRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
  }));
}

export async function countConversations(supabase: SupabaseClient): Promise<number> {
  const { count } = await supabase
    .from("coach_conversations")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

/** Same trailing-7-day window the coach-chat Edge Function itself uses to
 * enforce getWeeklyCoachMessageLimit — RLS scopes this to the current
 * user's own messages via their conversations, same as coach-chat does
 * with the caller's own JWT. */
export async function countCoachMessagesThisWeek(
  supabase: SupabaseClient
): Promise<number> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("coach_messages")
    .select("id", { count: "exact", head: true })
    .eq("role", "user")
    .gte("created_at", since);
  return count ?? 0;
}

/** Real message timestamps for this user's own (role='user') messages in
 * the last `days` days — powers the "Coach IA" dashboard sparkline and
 * windowed activity counts. Explicitly scoped by user_id (coach_messages
 * has the column directly) rather than relying on RLS alone, matching the
 * convention in lib/supabase/analyses.ts. */
export async function fetchCoachMessageTimestamps(
  supabase: SupabaseClient,
  userId: string,
  days: number
): Promise<string[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("coach_messages")
    .select("created_at")
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", since);

  if (error || !data) return [];
  return data.map((row) => row.created_at as string);
}

export async function countCoachMessagesAllTime(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("coach_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user");

  if (error) return 0;
  return count ?? 0;
}

type MessageRow = { id: string; role: "user" | "assistant"; content: string };

export async function fetchConversationMessages(
  supabase: SupabaseClient,
  conversationId: string
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("coach_messages")
    .select("id, role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as MessageRow[];
}
