"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Conversation } from "@/lib/data/coach";
import { cn } from "@/lib/utils";

export function CoachSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}) {
  return (
    <div className="hidden w-64 shrink-0 flex-col gap-3 lg:flex">
      <Button type="button" onClick={onNewConversation} className="w-full">
        <Plus className="h-4 w-4" />
        Nouvelle conversation
      </Button>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-2">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            type="button"
            onClick={() => onSelectConversation(conv.id)}
            className={cn(
              "truncate rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-150",
              activeConversationId === conv.id
                ? "bg-brand-500/15 text-white"
                : "text-white/55 hover:bg-white/[0.06] hover:text-white"
            )}
          >
            {conv.title}
          </button>
        ))}
      </div>
    </div>
  );
}
