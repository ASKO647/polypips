"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";

export function DisconnectSessionsButton({
  action,
}: {
  action: () => Promise<{ error: string | null }>;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleClick() {
    if (
      !window.confirm(
        "Déconnecter toutes les sessions ? Vous devrez vous reconnecter et re-valider la double authentification."
      )
    ) {
      return;
    }
    startTransition(async () => {
      const { error } = await action();
      setResult(error ? "Échec de la déconnexion." : "Toutes les sessions ont été déconnectées.");
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/15 disabled:pointer-events-none disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" strokeWidth={2} />
        Déconnecter toutes les sessions
      </button>
      {result && <p className="text-xs text-slate-400">{result}</p>}
    </div>
  );
}
