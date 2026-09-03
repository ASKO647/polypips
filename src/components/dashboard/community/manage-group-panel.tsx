"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, Check, Copy, Loader2, Trash2, X } from "lucide-react";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { createClient } from "@/lib/supabase/client";
import {
  approveMember,
  deleteGroup,
  rejectMember,
  removeMember,
  updateGroup,
  uploadGroupAvatar,
  validateCommunityImage,
} from "@/lib/supabase/community";
import { cn } from "@/lib/utils";
import type { CommunityMember, CommunityMemberStatus } from "@/lib/data/community";

export function ManageGroupPanel({
  open,
  onClose,
  groupId,
  groupName,
  groupDescription,
  groupAvatarUrl,
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
  groupAvatarUrl: string | null;
  isPrivate: boolean;
  inviteCode: string | null;
  members: CommunityMember[];
  onGroupUpdated: (patch: { isPrivate?: boolean; avatarUrl?: string }) => void;
  onMemberUpdated: (userId: string, status: CommunityMemberStatus | "removed") => void;
  onGroupDeleted: () => void;
}) {
  const t = useTranslations("Community.ManageGroupPanel");
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleAvatarPick = () => avatarInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validateCommunityImage(file);
    if (validationError) {
      setAvatarError(validationError);
      return;
    }

    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const supabase = createClient();
      const newUrl = await uploadGroupAvatar(supabase, groupId, file);
      onGroupUpdated({ avatarUrl: newUrl });
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : t("uploadError"));
    } finally {
      setAvatarUploading(false);
    }
  };

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
      setError(err instanceof Error ? err.message : t("privacyError"));
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
      setError(err instanceof Error ? err.message : t("actionError"));
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
      setError(err instanceof Error ? err.message : t("actionError"));
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
      setError(err instanceof Error ? err.message : t("actionError"));
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
      setError(err instanceof Error ? err.message : t("deleteError"));
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl border border-white/10 bg-[#0f0808] shadow-[0_20px_60px_-16px_rgba(0,0,0,0.6)]">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 p-5">
          <div className="min-w-0">
            <h2 className="truncate font-display text-base font-bold text-white">{t("title", { groupName })}</h2>
            {groupDescription && <p className="mt-0.5 line-clamp-1 text-xs text-white/40">{groupDescription}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="shrink-0 rounded-full p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-col gap-5">
            {error && <p className="text-xs font-medium text-rose-400">{error}</p>}

            <div className="flex flex-col items-center gap-2">
              <div className="relative shrink-0">
                <UserAvatar name={groupName} avatarUrl={groupAvatarUrl} size={72} className="text-xl" />
                <button
                  type="button"
                  onClick={handleAvatarPick}
                  disabled={avatarUploading}
                  aria-label={t("changeAvatar")}
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0f0808] bg-white/[0.08] text-white/70 transition-colors hover:text-white disabled:pointer-events-none"
                >
                  {avatarUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                  ) : (
                    <Camera className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              {avatarError && <p className="text-xs font-medium text-rose-400">{avatarError}</p>}
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5">
              <div>
                <p className="text-sm font-semibold text-white">{isPrivate ? t("privacyPrivate") : t("privacyPublic")}</p>
                <p className="mt-0.5 text-xs text-white/40">
                  {isPrivate ? t("privacyPrivateHint") : t("privacyPublicHint")}
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
                <p className="text-xs font-medium text-white/50">{t("inviteCodeLabel")}</p>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5">
                  <span className="flex-1 font-mono text-sm tracking-widest text-white">{inviteCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    aria-label={t("copyCode")}
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
                  {t("pendingRequests", { count: pendingMembers.length })}
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
                        {t("approve")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(member.userId)}
                        disabled={busyUserId === member.userId}
                        className="shrink-0 rounded-full bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 disabled:opacity-50"
                      >
                        {t("reject")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-white/50">{t("membersCount", { count: approvedMembers.length + 1 })}</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
                  <span className="flex-1 text-sm text-white/50">{t("youOwner")}</span>
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
                      {t("remove")}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-rose-500/20 pt-4">
              {deleteConfirming ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs leading-relaxed text-white/50">
                    {t("deleteWarning")}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirming(false)}
                      className="flex-1 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
                    >
                      {deleting ? t("confirming") : t("confirm")}
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
                  {t("deleteGroup")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
