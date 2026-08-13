"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";

const WALLET_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export function AddWalletForm({
  onAdded,
  disabled,
}: {
  onAdded: (walletId: string) => void;
  disabled?: boolean;
}) {
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = address.trim();
    if (!WALLET_ADDRESS_RE.test(trimmed)) {
      setError("Adresse invalide. Format attendu : 0x suivi de 40 caractères hexadécimaux.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/wallets/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Impossible d'ajouter ce portefeuille.");
      }
      setAddress("");
      onAdded(data.walletId as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
    >
      <div>
        <p className="text-sm font-semibold text-white">
          Suivre un portefeuille Polymarket
        </p>
        <p className="mt-1 text-xs text-white/45">
          Collez l&apos;adresse d&apos;un portefeuille (0x...) pour l&apos;ajouter à la liste et le suivre.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x1234...abcd"
          disabled={disabled || submitting}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none disabled:opacity-50"
        />
        <Button type="submit" disabled={disabled || submitting || !address.trim()}>
          {submitting ? "Ajout..." : "Ajouter"}
          <ButtonIcon>
            <Plus className="h-4 w-4" />
          </ButtonIcon>
        </Button>
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </form>
  );
}
