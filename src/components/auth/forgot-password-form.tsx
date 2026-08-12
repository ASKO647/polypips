"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = email.trim().length > 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/reset-password` }
      );

      // Supabase never reveals whether the email exists - any non-error
      // response means "email sent" from the user's point of view, and we
      // keep it that way even on our own error handling below.
      if (resetError) {
        if (resetError.code === "email_address_invalid") {
          setError("Adresse email invalide.");
        } else if (resetError.code === "over_email_send_rate_limit") {
          setError("Trop de tentatives. Merci de réessayer dans quelques minutes.");
        } else {
          setError("Une erreur est survenue. Merci de réessayer.");
        }
        return;
      }

      setSuccess(true);
    } catch {
      setError("Une erreur est survenue. Merci de réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-[2rem] border border-border bg-surface p-7 shadow-[0_30px_70px_-30px_rgba(23,11,13,0.18)] sm:p-9">
      <div className="flex justify-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-500">
          {success ? (
            <CheckCircle2 className="h-9 w-9" strokeWidth={2} />
          ) : (
            <Lock className="h-9 w-9" strokeWidth={2} />
          )}
        </span>
      </div>

      <h2 className="mt-6 text-center font-display text-2xl font-semibold text-ink">
        {success ? "Email envoyé !" : "Mot de passe oublié ?"}
      </h2>
      <p className="mt-1.5 text-center text-sm text-body">
        {success
          ? "Vérifiez votre boîte de réception (et vos spams) pour réinitialiser votre mot de passe."
          : "Pas de souci. Entrez votre adresse e-mail, on vous envoie un lien pour réinitialiser votre mot de passe."}
      </p>

      {error && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!success && (
        <form className="mt-7 flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="forgot-email" className="text-sm font-semibold text-ink">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-body-soft" />
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="vous@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-xl border border-border-strong bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-body-soft/70 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          <Button type="submit" size="lg" disabled={!canSubmit || submitting} className="w-full">
            {submitting ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              "Envoyer le lien de réinitialisation →"
            )}
          </Button>
        </form>
      )}

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-body-soft">
          ou
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Link
        href="/login"
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-border-strong bg-surface text-sm font-semibold text-ink transition-colors hover:bg-ink/[0.03]"
      >
        <ArrowLeft className="h-4.5 w-4.5" />
        Retour à la connexion
      </Link>

      <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm text-body">
        <span className="inline-flex items-center gap-2">
          <HelpCircle className="h-4 w-4 shrink-0 text-brand-500" />
          Vous avez d&apos;autres problèmes ?
        </span>
        <Link
          href="/support"
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          Contactez notre support
        </Link>
      </p>
    </div>
  );
}
