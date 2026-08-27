"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Clock, Lock, Settings, ShieldX } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { MessageBubble } from "@/components/dashboard/community/message-bubble";
import { MessageInput } from "@/components/dashboard/community/message-input";
import { ManageGroupPanel } from "@/components/dashboard/community/manage-group-panel";
import { ReportMessageModal } from "@/components/dashboard/community/report-message-modal";
import { createClient } from "@/lib/supabase/client";
import {
  fetchMessages,
  fetchReactions,
  getGroupView,
  joinGroup,
  subscribeToGroupMessages,
  subscribeToGroupReactions,
  toggleReaction,
} from "@/lib/supabase/community";
import type { CommunityGroupView, CommunityMessage, MessageReaction, MessageReactionEmoji } from "@/lib/data/community";

export function GroupViewFlow({
  groupId,
  initialView,
  initialMessages,
  initialReactions,
  currentUserId,
  hasActiveSubscription,
  cancelled,
}: {
  groupId: string;
  initialView: CommunityGroupView;
  initialMessages: CommunityMessage[];
  initialReactions: MessageReaction[];
  currentUserId: string;
  hasActiveSubscription: boolean;
  cancelled: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState(initialView);
  const [messages, setMessages] = useState(initialMessages);
  const [reactions, setReactions] = useState(initialReactions);
  const [manageOpen, setManageOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isApprovedMember = view.isOwner || view.myMembership?.status === "approved";

  useEffect(() => {
    if (!isApprovedMember) return;
    const supabase = createClient();
    const channel = subscribeToGroupMessages(supabase, groupId, (message) => {
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, isApprovedMember]);

  useEffect(() => {
    if (!isApprovedMember) return;
    const supabase = createClient();
    const channel = subscribeToGroupReactions(supabase, groupId, (event) => {
      setReactions((prev) => {
        const matches = (r: MessageReaction) =>
          r.messageId === event.reaction.messageId && r.userId === event.reaction.userId && r.emoji === event.reaction.emoji;
        if (event.type === "insert") {
          return prev.some(matches) ? prev : [...prev, event.reaction];
        }
        return prev.filter((r) => !matches(r));
      });
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, isApprovedMember]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const memberByUserId = new Map(view.members.map((m) => [m.userId, m]));

  const reactionsByMessage = new Map<string, MessageReaction[]>();
  for (const reaction of reactions) {
    const bucket = reactionsByMessage.get(reaction.messageId);
    if (bucket) bucket.push(reaction);
    else reactionsByMessage.set(reaction.messageId, [reaction]);
  }

  const handleToggleReaction = (messageId: string, emoji: MessageReactionEmoji) => {
    const alreadyReacted = reactions.some(
      (r) => r.messageId === messageId && r.userId === currentUserId && r.emoji === emoji
    );
    // Optimistic update — the realtime subscription above will reconcile
    // (and de-dupe, via the same matches() check) once the server confirms.
    setReactions((prev) =>
      alreadyReacted
        ? prev.filter((r) => !(r.messageId === messageId && r.userId === currentUserId && r.emoji === emoji))
        : [...prev, { messageId, userId: currentUserId, emoji }]
    );
    const supabase = createClient();
    toggleReaction(supabase, messageId, emoji).catch(() => {
      // Roll back on failure — most likely cause is the caller no longer
      // being an approved member (e.g. removed mid-session).
      setReactions((prev) =>
        alreadyReacted
          ? [...prev, { messageId, userId: currentUserId, emoji }]
          : prev.filter((r) => !(r.messageId === messageId && r.userId === currentUserId && r.emoji === emoji))
      );
    });
  };

  const handleRequestAccess = async () => {
    setJoining(true);
    setJoinError(null);
    try {
      const supabase = createClient();
      await joinGroup(supabase, groupId);
      // Re-fetch rather than trust router.refresh()'s prop sync: this
      // component already holds its own `view`/`messages` state seeded
      // from the initial server render, so a plain refresh wouldn't
      // re-run useState's initializer — pulling the fresh view (and, if
      // now approved, the message history) directly is the only way this
      // component's own state reflects the join immediately.
      const freshView = await getGroupView(supabase, groupId);
      if (freshView) {
        setView(freshView);
        if (freshView.isOwner || freshView.myMembership?.status === "approved") {
          const freshMessages = await fetchMessages(supabase, groupId);
          setMessages(freshMessages);
          setReactions(await fetchReactions(supabase, freshMessages.map((m) => m.id)));
        }
      }
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Impossible de rejoindre ce groupe.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col gap-4 lg:h-[calc(100dvh-6rem)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard/community"
            aria-label="Retour à la Communauté"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          </Link>
          <UserAvatar name={view.group.name} avatarUrl={view.group.avatarUrl} size={40} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-bold text-white">{view.group.name}</p>
              {view.group.isPrivate && <Lock className="h-3 w-3 shrink-0 text-white/40" strokeWidth={2.5} />}
            </div>
            <p className="text-xs text-white/40">
              {view.members.length} membre{view.members.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {view.isOwner && (
          <button
            type="button"
            onClick={() => setManageOpen(true)}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/25 hover:text-white"
          >
            <Settings className="h-3.5 w-3.5" strokeWidth={2} />
            Gérer
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        {isApprovedMember ? (
          <LockedOverlay
            locked={!hasActiveSubscription}
            cancelled={cancelled}
            className="flex h-full flex-col overflow-hidden"
            contentClassName="flex h-full flex-col overflow-hidden"
            message={
              cancelled
                ? "Réabonnez-vous pour continuer à discuter dans ce groupe."
                : "Débloquez votre abonnement pour accéder au chat de ce groupe."
            }
          >
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-white/40">
                  Aucun message pour le moment. Lancez la discussion !
                </p>
              ) : (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.userId === currentUserId}
                    senderName={memberByUserId.get(message.userId)?.displayName ?? "Membre"}
                    senderAvatarUrl={memberByUserId.get(message.userId)?.avatarUrl ?? null}
                    reactions={reactionsByMessage.get(message.id) ?? []}
                    currentUserId={currentUserId}
                    onReport={() => setReportTarget(message.id)}
                    onToggleReaction={(emoji) => handleToggleReaction(message.id, emoji)}
                  />
                ))
              )}
            </div>
            <MessageInput groupId={groupId} userId={currentUserId} disabled={!hasActiveSubscription} />
          </LockedOverlay>
        ) : view.myMembership?.status === "pending" ? (
          <StatusPanel
            icon={Clock}
            title="Demande en attente"
            message="Votre demande d'accès a été envoyée au propriétaire du groupe. Vous serez ajouté dès qu'elle sera approuvée."
          />
        ) : view.myMembership?.status === "rejected" ? (
          <StatusPanel
            icon={ShieldX}
            title="Demande refusée"
            message="Votre demande d'accès à ce groupe a été refusée par son propriétaire."
          />
        ) : (
          <StatusPanel
            icon={Lock}
            title={view.group.isPrivate ? "Groupe privé" : "Rejoindre ce groupe"}
            message={
              view.group.isPrivate
                ? "Ce groupe est privé. Demandez l'accès pour rejoindre la discussion."
                : "Rejoignez ce groupe pour accéder à la discussion."
            }
            action={
              <button
                type="button"
                onClick={handleRequestAccess}
                disabled={joining}
                className="flex h-10 items-center justify-center rounded-full bg-brand-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-40"
              >
                {joining ? "..." : view.group.isPrivate ? "Demander l'accès" : "Entrer"}
              </button>
            }
            error={joinError}
          />
        )}
      </div>

      {view.isOwner && (
        <ManageGroupPanel
          open={manageOpen}
          onClose={() => setManageOpen(false)}
          groupId={groupId}
          groupName={view.group.name}
          groupDescription={view.group.description}
          groupAvatarUrl={view.group.avatarUrl}
          isPrivate={view.group.isPrivate}
          inviteCode={view.group.inviteCode}
          members={view.members}
          onGroupUpdated={(patch) => setView((prev) => ({ ...prev, group: { ...prev.group, ...patch } }))}
          onMemberUpdated={(userId, status) =>
            setView((prev) => ({
              ...prev,
              members:
                status === "removed"
                  ? prev.members.filter((m) => m.userId !== userId)
                  : prev.members.map((m) => (m.userId === userId ? { ...m, status } : m)),
            }))
          }
          onGroupDeleted={() => router.push("/dashboard/community")}
        />
      )}

      {reportTarget && (
        <ReportMessageModal messageId={reportTarget} onClose={() => setReportTarget(null)} />
      )}
    </div>
  );
}

function StatusPanel({
  icon: Icon,
  title,
  message,
  action,
  error,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  message: string;
  action?: React.ReactNode;
  error?: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-white/40">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="max-w-xs text-xs leading-relaxed text-white/40">{message}</p>
      {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
      {action}
    </div>
  );
}
