"use client";

import { useState } from "react";
import { Check, Copy, Trash2, UserMinus, X } from "lucide-react";
import { initialsFor, type GroupMember } from "@/lib/data/community";
import { createClient } from "@/lib/supabase/client";
import {
  approveMember,
  GroupActionError,
  rejectMember,
  removeMember,
  setGroupPrivacy,
} from "@/lib/supabase/groups-client";
import { cn } from "@/lib/utils";

export function ManageGroupPanel({
  open,
  onClose,
  groupId,
  groupName,
  isPrivate,
  inviteCode,
  members,
  onChanged,
  onDeleteRequested,
}: {
  open: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  isPrivate: boolean;
  inviteCode: string | null;
  members: GroupMember[];
  onChanged: () => void;
  onDeleteRequested: () => void;
}) {
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [togglingPrivacy, setTogglingPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Impossible de copier le code.");
    }
  };

  const pending = members.filter((m) => m.status === "pending");
  const approved = members.filter((m) => m.status === "approved");

  const runAction = async (userId: string, action: () => Promise<void>) => {
    setBusyUserId(userId);
    setError(null);
    try {
      await action();
      onChanged();
    } catch (err) {
      setError(err instanceof GroupActionError ? err.message : "Une erreur est survenue.");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleTogglePrivacy = async () => {
    setTogglingPrivacy(true);
    setError(null);
    try {
      const supabase = createClient();
      await setGroupPrivacy(supabase, groupId, !isPrivate);
      onChanged();
    } catch {
      setError("Impossible de changer la confidentialité du groupe.");
    } finally {
      setTogglingPrivacy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={onClose} aria-hidden />
      <div className="absolute inset-y-0 right-0 flex w-[340px] max-w-[90vw] animate-fade-up flex-col border-l border-white/10 bg-[#160b0c]">
        <div className="flex h-[64px] shrink-0 items-center justify-between px-4">
          <span className="font-display text-sm font-bold text-white">Gérer le groupe</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
          {error && (
            <p className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3.5 py-2.5 text-xs text-rose-300">
              {error}
            </p>
          )}

          <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="flex flex-col">
              <span className="text-sm font-medium text-white">Groupe privé</span>
              <span className="text-xs text-white/40">
                {isPrivate ? "Adhésion sur approbation." : "Adhésion immédiate pour tous."}
              </span>
            </span>
            <input
              type="checkbox"
              checked={isPrivate}
              disabled={togglingPrivacy}
              onChange={handleTogglePrivacy}
              className="h-5 w-5 shrink-0 accent-brand-500"
            />
          </label>

          {inviteCode && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-sm font-medium text-white">Code du groupe</p>
              <p className="mt-0.5 text-xs text-white/40">
                Partagez ce code pour que d&apos;autres membres trouvent le groupe via
                l&apos;onglet « Trouver un groupe ».
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-center font-mono text-sm font-bold tracking-[0.2em] text-white">
                  {inviteCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={cn(
                    "flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors",
                    copied
                      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-400"
                      : "border-white/10 bg-white/[0.04] text-white/60 hover:text-white"
                  )}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copié" : "Copier"}
                </button>
              </div>
            </div>
          )}

          {isPrivate && (
            <div>
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-white/30">
                Demandes en attente ({pending.length})
              </p>
              {pending.length === 0 ? (
                <p className="px-1 text-xs text-white/40">Aucune demande en attente.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pending.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-bold text-white/70">
                        {initialsFor(member.displayName)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-white/80">
                        {member.displayName}
                      </span>
                      <button
                        type="button"
                        disabled={busyUserId === member.userId}
                        onClick={() =>
                          runAction(member.userId, () => {
                            const supabase = createClient();
                            return approveMember(supabase, groupId, member.userId);
                          })
                        }
                        className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/25 disabled:opacity-40"
                      >
                        Accepter
                      </button>
                      <button
                        type="button"
                        disabled={busyUserId === member.userId}
                        onClick={() =>
                          runAction(member.userId, () => {
                            const supabase = createClient();
                            return rejectMember(supabase, groupId, member.userId);
                          })
                        }
                        className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-white/60 transition-colors hover:bg-white/[0.1] hover:text-white disabled:opacity-40"
                      >
                        Refuser
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-white/30">
              Membres ({approved.length})
            </p>
            <div className="flex flex-col gap-2">
              {approved.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-bold text-white/70">
                    {initialsFor(member.displayName)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-white/80">
                    {member.displayName}
                    {member.role === "owner" && (
                      <span className="ml-1.5 text-[11px] text-white/35">(propriétaire)</span>
                    )}
                  </span>
                  {member.role !== "owner" && (
                    <button
                      type="button"
                      disabled={busyUserId === member.userId}
                      onClick={() =>
                        runAction(member.userId, () => {
                          const supabase = createClient();
                          return removeMember(supabase, groupId, member.userId);
                        })
                      }
                      aria-label={`Retirer ${member.displayName} du groupe`}
                      className="shrink-0 rounded-full p-1.5 text-white/40 transition-colors hover:bg-rose-500/15 hover:text-rose-400 disabled:opacity-40"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onDeleteRequested}
            className={cn(
              "mt-auto flex items-center justify-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/[0.06] px-4 py-2.5 text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-500/[0.12]"
            )}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer « {groupName} »
          </button>
        </div>
      </div>
    </div>
  );
}
