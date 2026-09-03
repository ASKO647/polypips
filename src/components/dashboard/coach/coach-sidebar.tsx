"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConversationSummary } from "@/lib/data/coach";
import { cn } from "@/lib/utils";

export function CoachSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}) {
  const t = useTranslations("Coach.Sidebar");

  return (
    <div className="hidden w-64 shrink-0 flex-col gap-3 lg:flex">
      <Button type="button" onClick={onNewConversation} className="w-full">
        <Plus className="h-4 w-4" />
        {t("newConversation")}
      </Button>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-2">
        {conversations.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs leading-relaxed text-white/35">
            {t("empty")}
          </p>
        ) : (
          conversations.map((conv) => (
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
          ))
        )}
      </div>
    </div>
  );
}
