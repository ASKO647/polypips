"use client";

import { useState } from "react";
import { Lock, X } from "lucide-react";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { createClient } from "@/lib/supabase/client";
import { findGroupByCode, joinGroup } from "@/lib/supabase/community";
import type { FoundCommunityGroup } from "@/lib/data/community";

export function FindGroupPanel({
  open,
  onClose,
  onOpenGroup,
}: {
  open: boolean;
  onClose: () => void;
  onOpenGroup: (groupId: string) => void;
}) {
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<FoundCommunityGroup | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  if (!open) return null;

  const reset = () => {
    setCode("");
    setSearching(false);
    setSearched(false);
    setResult(null);
    setJoining(false);
    setError(null);
    setRequestSent(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searching || code.trim() === "") return;
    setSearching(true);
    setError(null);
    setResult(null);
    setSearched(false);
    try {
      const supabase = createClient();
      const found = await findGroupByCode(supabase, code.trim());
      setResult(found);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recherche impossible.");
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async () => {
    if (!result || joining) return;
    setJoining(true);
    setError(null);
    try {
      const supabase = createClient();
      const { status } = await joinGroup(supabase, result.id);
      if (status === "approved") {
        onOpenGroup(result.id);
        reset();
      } else {
        setRequestSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de rejoindre ce groupe.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0808] p-6 shadow-[0_20px_60px_-16px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-base font-bold text-white">Trouver un groupe</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
            className="rounded-full p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="mt-5 flex items-center gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Code d'invitation"
            maxLength={8}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm uppercase tracking-widest text-white placeholder:text-white/25 placeholder:normal-case placeholder:tracking-normal focus:border-white/25 focus:outline-none"
          />
          <button
            type="submit"
            disabled={searching || code.trim() === ""}
            className="shrink-0 rounded-full bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-40"
          >
            {searching ? "..." : "Chercher"}
          </button>
        </form>

        {error && <p className="mt-3 text-xs font-medium text-rose-400">{error}</p>}

        {searched && !result && (
          <p className="mt-4 text-sm text-white/50">Aucun groupe ne correspond à ce code.</p>
        )}

        {result && (
          <div className="mt-4 flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <UserAvatar name={result.name} avatarUrl={result.avatarUrl} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-white">{result.name}</p>
                  {result.isPrivate && <Lock className="h-3 w-3 shrink-0 text-white/40" strokeWidth={2.5} />}
                </div>
                <p className="line-clamp-1 text-xs text-white/40">{result.description || "Aucune description."}</p>
              </div>
            </div>

            {requestSent ? (
              <p className="text-center text-xs font-medium text-emerald-400">
                Demande envoyée — vous serez ajouté dès que le propriétaire l&apos;approuve.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleJoin}
                disabled={joining}
                className="flex h-10 w-full items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-40"
              >
                {joining ? "..." : result.isPrivate ? "Demander l'accès" : "Entrer"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
