"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConversationSummary } from "@/lib/data/coach";
import { cn } from "@/lib/utils";

export function CoachMobileHistory({
  open,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: {
  open: boolean;
  onClose: () => void;
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 animate-fade-in bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-y-0 right-0 flex w-[280px] max-w-[80vw] animate-fade-up flex-col border-l border-white/10 bg-[#160b0c]">
        <div className="flex h-[64px] items-center justify-between px-4">
          <span className="font-display text-sm font-bold text-white">
            Historique
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4">
          <Button
            type="button"
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            Nouvelle conversation
          </Button>
        </div>

        <div className="mt-3 flex flex-1 flex-col gap-1 overflow-y-auto px-4 pb-4">
          {conversations.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs leading-relaxed text-white/35">
              Aucune conversation pour le moment.
            </p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => {
                  onSelectConversation(conv.id);
                  onClose();
                }}
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
    </div>
  );
}
