"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createGroup } from "@/lib/supabase/community";
import { cn } from "@/lib/utils";

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
      const { id } = await createGroup(supabase, {
        name: name.trim(),
        description: description.trim(),
        isPrivate,
      });
      onCreated(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer le groupe.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0808] p-6 shadow-[0_20px_60px_-16px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-base font-bold text-white">Créer un groupe</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
            className="rounded-full p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="group-name" className="text-xs font-medium text-white/50">
              Nom du groupe
            </label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Traders Polymarket FR"
              maxLength={80}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="group-description" className="text-xs font-medium text-white/50">
              Description
            </label>
            <textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="De quoi parle ce groupe ?"
              rows={3}
              maxLength={280}
              className="resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-white">{isPrivate ? "Privé" : "Public"}</p>
              <p className="mt-0.5 text-xs text-white/40">
                {isPrivate
                  ? "Les nouveaux membres doivent être approuvés."
                  : "Tout le monde peut rejoindre directement."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPrivate}
              onClick={() => setIsPrivate((v) => !v)}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
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

          {error && <p className="text-xs font-medium text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting || name.trim() === ""}
            className="flex h-11 w-full items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-40"
          >
            {submitting ? "Création..." : "Créer le groupe"}
          </button>
        </form>
      </div>
    </div>
  );
}
