"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OWNER_BASE_PATH } from "@/lib/owner-path";

/** First-time TOTP enrollment for the OWNER account, entirely on Supabase
 * Auth's native MFA API (enroll → challenge → verify) — no separate 2FA
 * system. Verifying the very first factor also elevates the session to
 * aal2 in the same call, so success here goes straight into the console. */
export function MfaEnrollForm() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (enrollError) {
        setError("Impossible de démarrer l'activation. Merci de réessayer.");
        return;
      }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || code.trim().length !== 6 || submitting) return;

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
      setError("Code invalide. Vérifiez votre application d'authentification.");
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
        Activer la double authentification
      </h1>
      <p className="mt-1.5 text-center text-sm text-slate-400">
        Obligatoire pour accéder à la console. Scannez ce QR code avec votre
        application d&apos;authentification (Google Authenticator, 1Password...).
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300">
          {error}
        </p>
      )}

      {qrCode ? (
        <>
          <div className="mt-5 flex justify-center rounded-xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- data: URI from Supabase, not an optimizable remote asset */}
            <img src={qrCode} alt="QR code TOTP" className="h-40 w-40" />
          </div>
          {secret && (
            <p className="mt-3 break-all text-center text-xs text-slate-500">
              Clé manuelle : {secret}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
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
              {submitting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : "Activer"}
            </button>
          </form>
        </>
      ) : (
        !error && (
          <div className="mt-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        )
      )}
    </div>
  );
}
