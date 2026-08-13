"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChangeEmailButton } from "@/components/dashboard/settings/change-email-button";
import { createClient } from "@/lib/supabase/client";

export function ProfileTab({
  email,
  initialUsername,
  onOpenDeleteModal,
  deletionRequested,
}: {
  email: string;
  initialUsername: string;
  onOpenDeleteModal: () => void;
  deletionRequested: boolean;
}) {
  const [username, setUsername] = useState(initialUsername);
  const [language, setLanguage] = useState("fr");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = username !== initialUsername;

  const handleSave = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: username.trim() },
      });
      if (updateError) throw new Error(updateError.message);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setUsername(initialUsername);
    setError(null);
    setSaved(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label
          htmlFor="settings-username"
          className="block text-sm font-semibold text-white"
        >
          Nom d&apos;utilisateur
        </label>
        <input
          id="settings-username"
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setSaved(false);
          }}
          placeholder="Votre nom"
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none sm:max-w-md"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-white">
          Adresse e-mail
        </label>
        <div className="mt-2 flex flex-col gap-2.5 sm:flex-row sm:items-start">
          <input
            type="email"
            value={email}
            disabled
            readOnly
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white/50 sm:max-w-md"
          />
          <ChangeEmailButton currentEmail={email} />
        </div>
      </div>

      <div>
        <label
          htmlFor="settings-language"
          className="block text-sm font-semibold text-white"
        >
          Sélectionner la langue
        </label>
        <select
          id="settings-language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:outline-none sm:max-w-xs"
        >
          <option value="fr" className="bg-[#160b0c] text-white">
            Français
          </option>
          <option value="en" className="bg-[#160b0c] text-white">
            English
          </option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={!dirty}
          className="text-sm font-semibold text-white/50 transition-colors hover:text-white disabled:opacity-40"
        >
          Annuler
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Enregistré
          </span>
        )}
        {error && <span className="text-xs text-rose-400">{error}</span>}
      </div>

      <div className="border-t border-white/10 pt-6">
        <h3 className="text-sm font-bold text-rose-400">Zone danger</h3>
        <p className="mt-2 text-sm text-white/50">
          La suppression de votre compte est définitive et irréversible.
        </p>
        {deletionRequested ? (
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-white/70">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            Demande de suppression enregistrée. Notre équipe vous contactera
            par email.
          </p>
        ) : (
          <button
            type="button"
            onClick={onOpenDeleteModal}
            className="mt-4 flex h-11 items-center justify-center rounded-full border border-rose-400/25 bg-rose-500/[0.06] px-6 text-sm font-semibold text-rose-400 transition-colors duration-150 hover:border-rose-400/40"
          >
            Supprimer mon compte
          </button>
        )}
      </div>
    </div>
  );
}
