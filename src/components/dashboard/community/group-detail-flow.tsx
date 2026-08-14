"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { GroupChatMessage } from "@/components/dashboard/community/group-chat-message";
import { GroupChatInput } from "@/components/dashboard/community/group-chat-input";
import { ManageGroupPanel } from "@/components/dashboard/community/manage-group-panel";
import { DeleteGroupModal } from "@/components/dashboard/community/delete-group-modal";
import type { GroupMember, GroupMessage, GroupSummary } from "@/lib/data/community";
import { createClient } from "@/lib/supabase/client";
import {
  deleteGroup,
  GroupActionError,
  ImageUploadError,
  joinGroup,
  reportMessage,
  sendGroupMessage,
  uploadGroupImage,
} from "@/lib/supabase/groups-client";

export function GroupDetailFlow({
  group,
  currentUserId,
  ownMembership,
  initialMessages,
  initialMembers,
  hasCommunityAccess,
}: {
  group: GroupSummary;
  currentUserId: string | null;
  ownMembership: GroupMember | null;
  initialMessages: GroupMessage[];
  initialMembers: GroupMember[];
  hasCommunityAccess: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<GroupMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [managePanelOpen, setManagePanelOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isApproved = ownMembership?.status === "approved";
  const membersByUserId = useRef(new Map(initialMembers.map((m) => [m.userId, m.displayName])));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Real multi-user chat: new messages (from any member, any device) arrive
  // here via Postgres changes rather than only after this client's own
  // send — see the supabase_realtime publication additions in the
  // 20260814090000 migration.
  useEffect(() => {
    if (!isApproved || !hasCommunityAccess) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`group-messages-${group.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${group.id}` },
        (payload) => {
          const row = payload.new as {
            id: string;
            group_id: string;
            user_id: string;
            content: string;
            image_url: string | null;
            created_at: string;
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                groupId: row.group_id,
                userId: row.user_id,
                displayName: membersByUserId.current.get(row.user_id) ?? "Membre",
                content: row.content,
                imageUrl: row.image_url,
                createdAt: row.created_at,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [group.id, isApproved, hasCommunityAccess]);

  const handleSend = async (image: File | null) => {
    if (!currentUserId || sending) return;
    const trimmed = inputValue.trim();
    if (trimmed === "" && !image) return;

    setSending(true);
    setSendError(null);
    try {
      const supabase = createClient();
      let imagePath: string | null = null;
      if (image) {
        imagePath = await uploadGroupImage(supabase, {
          groupId: group.id,
          userId: currentUserId,
          file: image,
        });
      }
      await sendGroupMessage(supabase, {
        groupId: group.id,
        userId: currentUserId,
        content: trimmed,
        imageUrl: imagePath,
      });
      setInputValue("");
    } catch (err) {
      setSendError(
        err instanceof ImageUploadError
          ? err.message
          : err instanceof GroupActionError
            ? err.message
            : "Échec de l'envoi du message."
      );
    } finally {
      setSending(false);
    }
  };

  const handleReport = async (messageId: string) => {
    if (reportedIds.has(messageId)) return;
    setReportedIds((prev) => new Set(prev).add(messageId));
    try {
      const supabase = createClient();
      await reportMessage(supabase, messageId, "Signalé par un membre");
    } catch {
      // A duplicate report (already-reported) is fine to swallow — the
      // button already reflects the reported state either way.
    }
  };

  const handleJoin = async () => {
    if (joining) return;
    setJoining(true);
    setJoinError(null);
    try {
      const supabase = createClient();
      await joinGroup(supabase, group.id);
      router.refresh();
    } catch (err) {
      setJoinError(err instanceof GroupActionError ? err.message : "Une erreur est survenue.");
    } finally {
      setJoining(false);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      const supabase = createClient();
      await deleteGroup(supabase, group.id);
      router.push("/dashboard/community");
    } catch {
      setDeleteModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/community"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Tous les groupes
      </Link>

      <LockedOverlay
        locked={!hasCommunityAccess}
        message="La Communauté est réservée aux abonnés Pro et Pro+. Passez à un plan supérieur pour participer."
      >
        <div className="flex h-[calc(100vh-220px)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm font-bold text-brand-400">
                {group.name.trim().slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-white">{group.name}</p>
                <p className="flex items-center gap-1 text-[11px] text-white/40">
                  {group.isPrivate && <Lock className="h-3 w-3" strokeWidth={2.25} />}
                  <Users className="h-3 w-3" strokeWidth={2.25} />
                  {group.memberCount} membre{group.memberCount > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {ownMembership?.role === "owner" && (
              <button
                type="button"
                onClick={() => setManagePanelOpen(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors duration-150 hover:text-white"
              >
                <Settings className="h-3.5 w-3.5" />
                Gérer
              </button>
            )}
          </div>

          {ownMembership?.status === "pending" ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="text-sm font-semibold text-white">Demande envoyée</p>
              <p className="max-w-sm text-xs leading-relaxed text-white/45">
                Le propriétaire du groupe doit approuver votre demande avant que vous
                puissiez y accéder.
              </p>
            </div>
          ) : ownMembership?.status === "rejected" ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm font-semibold text-white">Demande refusée</p>
              <p className="max-w-sm text-xs leading-relaxed text-white/45">
                Votre demande d&apos;adhésion à ce groupe a été refusée.
              </p>
              {joinError && <p className="text-xs text-rose-400">{joinError}</p>}
              <Button type="button" size="sm" onClick={handleJoin} disabled={joining}>
                {joining ? "Envoi..." : "Redemander à rejoindre"}
              </Button>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <p className="text-sm font-semibold text-white/70">
                      Aucun message pour le moment
                    </p>
                    <p className="max-w-xs text-xs leading-relaxed text-white/40">
                      {isApproved
                        ? "Soyez le premier à écrire dans ce groupe."
                        : "Rejoignez ce groupe pour voir et envoyer des messages."}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {messages.map((message) => (
                      <GroupChatMessage
                        key={message.id}
                        message={message}
                        isOwn={message.userId === currentUserId}
                        reported={reportedIds.has(message.id)}
                        onReport={handleReport}
                      />
                    ))}
                  </div>
                )}
              </div>

              {isApproved ? (
                <GroupChatInput
                  value={inputValue}
                  onChange={setInputValue}
                  onSend={handleSend}
                  disabled={sending}
                  error={sendError}
                />
              ) : (
                <div className="border-t border-white/10 p-4">
                  {joinError && <p className="mb-2 text-xs text-rose-400">{joinError}</p>}
                  <Button type="button" onClick={handleJoin} disabled={joining} className="w-full">
                    {joining
                      ? "Envoi..."
                      : group.isPrivate
                        ? "Demander à rejoindre"
                        : "Rejoindre pour participer"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </LockedOverlay>

      {ownMembership?.role === "owner" && (
        <ManageGroupPanel
          open={managePanelOpen}
          onClose={() => setManagePanelOpen(false)}
          groupId={group.id}
          groupName={group.name}
          isPrivate={group.isPrivate}
          inviteCode={group.inviteCode}
          members={initialMembers}
          onChanged={() => router.refresh()}
          onDeleteRequested={() => {
            setManagePanelOpen(false);
            setDeleteModalOpen(true);
          }}
        />
      )}

      <DeleteGroupModal
        open={deleteModalOpen}
        groupName={group.name}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteGroup}
      />
    </div>
  );
}
