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
