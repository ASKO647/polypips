"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OWNER_BASE_PATH } from "@/lib/owner-path";

/** Step-up verification for a session that already has a verified TOTP
 * factor but hasn't reached aal2 yet this visit — separate from
 * MfaEnrollForm, which only ever runs once per account. */
export function MfaChallengeForm({ factorId }: { factorId: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length !== 6 || submitting) return;

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (challengeError) {
      setError("Une erreur est survenue. Merci de réessayer.");
      setSubmitting(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });

    if (verifyError) {
      setError("Code invalide.");
      setSubmitting(false);
      return;
    }

    router.replace(OWNER_BASE_PATH);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#12151b] p-7">
      <div className="flex justify-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
          <ShieldCheck className="h-5 w-5" strokeWidth={2} />
        </span>
      </div>
      <h1 className="mt-4 text-center font-display text-lg font-semibold text-white">
        Vérification en deux étapes
      </h1>
      <p className="mt-1.5 text-center text-sm text-slate-400">
        Entrez le code à 6 chiffres de votre application d&apos;authentification.
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          autoFocus
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="h-12 w-full rounded-xl border border-white/15 bg-[#0b0d10] text-center text-lg tracking-[0.4em] text-white outline-none focus:border-cyan-400"
        />
        <button
          type="submit"
          disabled={code.trim().length !== 6 || submitting}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-cyan-500 text-sm font-semibold text-[#0b0d10] transition-colors hover:bg-cyan-400 disabled:pointer-events-none disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : "Vérifier"}
        </button>
      </form>
    </div>
  );
}
