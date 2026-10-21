"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Customer-facing TOTP enroll/disable modal, shared between the Profil
 * and Sécurité tabs — both used to link to a nonexistent /mfa-setup page.
 * Built on Supabase Auth's native MFA API (enroll → challenge → verify,
 * or listFactors → unenroll), the same flow the owner console already
 * uses for its own account. */
export function MfaEnrollModal({
  open,
  mfaEnabled,
  onClose,
  onChanged,
}: {
  open: boolean;
  mfaEnabled: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const locale = useLocale();
  const router = useRouter();
  const fr = locale === "fr";
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [disabling, setDisabling] = useState(false);

  useEffect(() => {
    if (!open || mfaEnabled) return;
    // Resets the enrollment form each time the modal reopens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);
    setQrCode(null);
    setSecret(null);
    setFactorId(null);
    setCode("");
    (async () => {
      const supabase = createClient();
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (enrollError) {
        setError(fr ? "Impossible de démarrer l'activation. Réessayez." : "Could not start enrollment. Please try again.");
        return;
      }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    })();
  }, [open, mfaEnabled, fr]);

  if (!open) return null;

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!factorId || code.trim().length !== 6 || submitting) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      setError(fr ? "Une erreur est survenue. Réessayez." : "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    if (verifyError) {
      setError(fr ? "Code invalide. Vérifiez votre application d'authentification." : "Invalid code. Check your authenticator app.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    onChanged();
    router.refresh();
    onClose();
  }

  async function handleDisable() {
    setDisabling(true);
    setError(null);
    const supabase = createClient();
    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
    const totpFactor = factors?.totp?.[0];
    if (listError || !totpFactor) {
      setError(fr ? "Impossible de récupérer votre configuration 2FA." : "Could not retrieve your 2FA configuration.");
      setDisabling(false);
      return;
    }
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
    if (unenrollError) {
      setError(fr ? "La désactivation a échoué. Réessayez." : "Disabling failed. Please try again.");
      setDisabling(false);
      return;
    }
    setDisabling(false);
    onChanged();
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-dash-overlay" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-sm animate-fade-up rounded-2xl border border-dash-border bg-dash-bg p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-500">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={fr ? "Fermer" : "Close"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dash-border text-dash-text-secondary transition-colors hover:text-dash-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {mfaEnabled ? (
          <>
            <h2 className="mt-4 font-display text-lg font-bold text-dash-text">
              {fr ? "Désactiver la double authentification" : "Disable two-factor authentication"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-dash-text-secondary">
              {fr
                ? "Votre compte sera protégé uniquement par votre mot de passe."
                : "Your account will only be protected by your password."}
            </p>
            {error && <p className="mt-3 text-sm font-semibold text-rose-400">{error}</p>}
            <button
              type="button"
              disabled={disabling}
              onClick={handleDisable}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-rose-500 text-sm font-semibold text-white transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
            >
              {disabling && <Loader2 className="h-4 w-4 animate-spin" />}
              {fr ? "Désactiver la 2FA" : "Disable 2FA"}
            </button>
          </>
        ) : (
          <>
            <h2 className="mt-4 font-display text-lg font-bold text-dash-text">
              {fr ? "Activer la double authentification" : "Enable two-factor authentication"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-dash-text-secondary">
              {fr
                ? "Scannez ce QR code avec votre application d'authentification (Google Authenticator, 1Password...)."
                : "Scan this QR code with your authenticator app (Google Authenticator, 1Password...)."}
            </p>
            {error && <p className="mt-3 text-sm font-semibold text-rose-400">{error}</p>}
            {qrCode ? (
              <>
                <div className="mt-4 flex justify-center rounded-xl bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- data: URI from Supabase, not an optimizable remote asset */}
                  <img src={qrCode} alt="QR code TOTP" className="h-36 w-36" />
                </div>
                {secret && (
                  <p className="mt-2 break-all text-center text-xs text-dash-text-faint">
                    {fr ? "Clé manuelle : " : "Manual key: "}{secret}
                  </p>
                )}
                <form onSubmit={handleVerify} className="mt-4 flex flex-col gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                    className="h-12 w-full rounded-xl border border-dash-border bg-dash-surface text-center text-lg tracking-[0.4em] text-dash-text outline-none focus:border-brand-400"
                  />
                  <button
                    type="submit"
                    disabled={code.trim().length !== 6 || submitting}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-500 text-sm font-semibold text-white transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {fr ? "Activer" : "Enable"}
                  </button>
                </form>
              </>
            ) : (
              !error && (
                <div className="mt-6 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-dash-text-faint" />
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
