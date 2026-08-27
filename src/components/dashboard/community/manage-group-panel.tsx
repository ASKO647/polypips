"use client";

import { useState } from "react";
import { Check, Copy, Trash2, X } from "lucide-react";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { createClient } from "@/lib/supabase/client";
import { approveMember, deleteGroup, rejectMember, removeMember, updateGroup } from "@/lib/supabase/community";
import { cn } from "@/lib/utils";
import type { CommunityMember, CommunityMemberStatus } from "@/lib/data/community";

export function ManageGroupPanel({
  open,
  onClose,
  groupId,
  groupName,
  groupDescription,
  isPrivate,
  inviteCode,
  members,
  onGroupUpdated,
  onMemberUpdated,
  onGroupDeleted,
}: {
  open: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  groupDescription: string;
  isPrivate: boolean;
  inviteCode: string | null;
  members: CommunityMember[];
  onGroupUpdated: (patch: { isPrivate: boolean }) => void;
  onMemberUpdated: (userId: string, status: CommunityMemberStatus | "removed") => void;
  onGroupDeleted: () => void;
}) {
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const approvedMembers = members.filter((m) => m.status === "approved" && m.role !== "owner");
  const pendingMembers = members.filter((m) => m.status === "pending");

  const handleTogglePrivacy = async () => {
    if (privacyBusy) return;
    setPrivacyBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      await updateGroup(supabase, groupId, { isPrivate: !isPrivate });
      onGroupUpdated({ isPrivate: !isPrivate });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de modifier la confidentialité.");
    } finally {
      setPrivacyBusy(false);
    }
  };

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied — non-critical, the code is still visible on screen.
    }
  };

  const handleApprove = async (userId: string) => {
    setBusyUserId(userId);
    setError(null);
    try {
      const supabase = createClient();
      await approveMember(supabase, groupId, userId);
      onMemberUpdated(userId, "approved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleReject = async (userId: string) => {
    setBusyUserId(userId);
    setError(null);
    try {
      const supabase = createClient();
      await rejectMember(supabase, groupId, userId);
      onMemberUpdated(userId, "rejected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRemove = async (userId: string) => {
    setBusyUserId(userId);
    setError(null);
    try {
      const supabase = createClient();
      await removeMember(supabase, groupId, userId);
      onMemberUpdated(userId, "removed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const supabase = createClient();
      await deleteGroup(supabase, groupId);
      onGroupDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible.");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl border border-white/10 bg-[#0f0808] shadow-[0_20px_60px_-16px_rgba(0,0,0,0.6)]">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 p-5">
          <div className="min-w-0">
            <h2 className="truncate font-display text-base font-bold text-white">Gérer {groupName}</h2>
            {groupDescription && <p className="mt-0.5 line-clamp-1 text-xs text-white/40">{groupDescription}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 rounded-full p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-col gap-5">
            {error && <p className="text-xs font-medium text-rose-400">{error}</p>}

            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5">
              <div>
                <p className="text-sm font-semibold text-white">{isPrivate ? "Privé" : "Public"}</p>
                <p className="mt-0.5 text-xs text-white/40">
                  {isPrivate ? "Les nouveaux membres doivent être approuvés." : "Tout le monde peut rejoindre directement."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPrivate}
                onClick={handleTogglePrivacy}
                disabled={privacyBusy}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50",
                  isPrivate ? "bg-brand-500" : "bg-white/15"
                )}
              >
                <span
                  className={cn(
                    "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                    isPrivate && "translate-x-5"
                  )}
                />
              </button>
            </div>

            {inviteCode && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-white/50">Code d&apos;invitation</p>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5">
                  <span className="flex-1 font-mono text-sm tracking-widest text-white">{inviteCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    aria-label="Copier le code"
                    className="shrink-0 text-white/50 transition-colors hover:text-white"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {isPrivate && pendingMembers.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-white/50">
                  Demandes en attente ({pendingMembers.length})
                </p>
                <div className="flex flex-col gap-2">
                  {pendingMembers.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5"
                    >
                      <UserAvatar name={member.displayName} avatarUrl={member.avatarUrl} size={32} className="text-xs" />
                      <span className="min-w-0 flex-1 truncate text-sm text-white">{member.displayName}</span>
                      <button
                        type="button"
                        onClick={() => handleApprove(member.userId)}
                        disabled={busyUserId === member.userId}
                        className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
                      >
                        Accepter
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(member.userId)}
                        disabled={busyUserId === member.userId}
                        className="shrink-0 rounded-full bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 disabled:opacity-50"
                      >
                        Refuser
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-white/50">Membres ({approvedMembers.length + 1})</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
                  <span className="flex-1 text-sm text-white/50">Vous (propriétaire)</span>
                </div>
                {approvedMembers.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5"
                  >
                    <UserAvatar name={member.displayName} avatarUrl={member.avatarUrl} size={32} className="text-xs" />
                    <span className="min-w-0 flex-1 truncate text-sm text-white">{member.displayName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(member.userId)}
                      disabled={busyUserId === member.userId}
                      className="shrink-0 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/25 disabled:opacity-50"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-rose-500/20 pt-4">
              {deleteConfirming ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs leading-relaxed text-white/50">
                    Cette action est irréversible. Le groupe, ses membres et tous ses messages seront définitivement supprimés.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirming(false)}
                      className="flex-1 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
                    >
                      {deleting ? "Suppression..." : "Confirmer"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeleteConfirming(true)}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-rose-500/30 text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-500/10"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                  Supprimer le groupe
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
