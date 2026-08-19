"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Lock, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initialsFor, type GroupSummary } from "@/lib/data/community";
import { createClient } from "@/lib/supabase/client";
import { findGroupByCode, GroupActionError, joinGroup } from "@/lib/supabase/groups-client";

export function FindGroupTab() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<GroupSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed === "" || searching) return;

    setSearching(true);
    setSearched(false);
    setError(null);
    setJoinError(null);
    try {
      const supabase = createClient();
      const found = await findGroupByCode(supabase, trimmed);
      setResult(found);
      setSearched(true);
    } catch (err) {
      setError(err instanceof GroupActionError ? err.message : "Une erreur est survenue.");
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async () => {
    if (!result || joining) return;
    setJoining(true);
    setJoinError(null);
    try {
      const supabase = createClient();
      await joinGroup(supabase, result.id);
      if (!result.isPrivate) {
        router.push(`/dashboard/community/${result.id}`);
        return;
      }
      setResult({ ...result, membershipStatus: "pending" });
    } catch (err) {
      setJoinError(err instanceof GroupActionError ? err.message : "Une erreur est survenue.");
    } finally {
      setJoining(false);
    }
  };

  const actionLabel =
    result?.membershipStatus === "approved"
      ? "Déjà membre"
      : result?.membershipStatus === "pending"
        ? "Demande en attente"
        : result?.membershipStatus === "rejected"
          ? "Redemander l'accès"
          : result?.isPrivate
            ? "Demander l'accès"
            : "Entrer";

  const actionDisabled =
    joining || result?.membershipStatus === "approved" || result?.membershipStatus === "pending";

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSearch} className="flex flex-col gap-2.5 sm:flex-row">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Code du groupe (ex : 39DZMZ5)"
          maxLength={12}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-mono text-sm tracking-[0.15em] text-white placeholder:font-sans placeholder:tracking-normal placeholder:text-white/25 focus:border-white/25 focus:outline-none sm:max-w-xs"
        />
        <Button type="submit" size="md" disabled={searching || code.trim() === ""}>
          <Search className="h-4 w-4" strokeWidth={2.5} />
          {searching ? "Recherche..." : "Rechercher"}
        </Button>
      </form>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      {searched && !result && !error && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.05] text-white/30">
            <Search className="h-4.5 w-4.5" />
          </span>
          <p className="text-sm font-semibold text-white">
            Aucun groupe trouvé avec ce code
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-white/45">
            Vérifiez le code auprès de la personne qui vous l&apos;a partagé.
          </p>
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm font-bold text-brand-400">
                {initialsFor(result.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-white">
                  {result.name}
                </p>
                <p className="flex items-center gap-1 text-xs text-white/40">
                  <Users className="h-3 w-3" strokeWidth={2.25} />
                  {result.memberCount} membre{result.memberCount > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-white/50">
              {result.isPrivate && <Lock className="h-3 w-3" strokeWidth={2.25} />}
              {result.isPrivate ? "Privé" : "Public"}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-white/55">
            {result.description || "Pas de description."}
          </p>

          {joinError && <p className="text-xs text-rose-400">{joinError}</p>}

          <Button
            type="button"
            variant={actionDisabled && result.membershipStatus ? "outline" : "primary"}
            disabled={actionDisabled}
            onClick={handleJoin}
            className="w-full"
          >
            {joining ? "Envoi..." : actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
