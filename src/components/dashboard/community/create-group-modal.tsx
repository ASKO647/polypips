"use client";

import { useState } from "react";
import { Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { createGroup, GroupActionError } from "@/lib/supabase/groups-client";

export function CreateGroupModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (groupId: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleClose = () => {
    if (submitting) return;
    setName("");
    setDescription("");
    setIsPrivate(false);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || name.trim() === "") return;
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const groupId = await createGroup(supabase, {
        name: name.trim(),
        description: description.trim(),
        isPrivate,
      });
      setName("");
      setDescription("");
      setIsPrivate(false);
      onCreated(groupId);
    } catch (err) {
      setError(err instanceof GroupActionError ? err.message : "Une erreur est survenue.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-black/70"
        onClick={handleClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md animate-fade-up rounded-2xl border border-white/10 bg-[#160b0c] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
            <Users className="h-5 w-5" strokeWidth={2} />
          </span>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-4 font-display text-lg font-bold text-white">
          Créer un groupe
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Donnez-lui un nom, une courte description, et choisissez s&apos;il est
          ouvert à tous ou sur demande d&apos;approbation.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div>
            <label htmlFor="group-name" className="mb-1.5 block text-xs font-medium text-white/50">
              Nom du groupe
            </label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Traders Polymarket FR"
              maxLength={80}
              disabled={submitting}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="group-description" className="mb-1.5 block text-xs font-medium text-white/50">
              Description
            </label>
            <textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="De quoi parle ce groupe ?"
              rows={3}
              maxLength={280}
              disabled={submitting}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none disabled:opacity-50"
            />
          </div>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="flex flex-col">
              <span className="text-sm font-medium text-white">Groupe privé</span>
              <span className="text-xs text-white/40">
                Les demandes d&apos;adhésion devront être approuvées.
              </span>
            </span>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              disabled={submitting}
              className="h-5 w-5 shrink-0 accent-brand-500"
            />
          </label>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
              className="sm:flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting || name.trim() === ""}
              className="sm:flex-1"
            >
              {submitting ? "Création..." : "Créer le groupe"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
