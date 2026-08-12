"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { getPasswordStrength } from "@/lib/password-strength";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const STRENGTH_COLORS = [
  "bg-border-strong",
  "bg-brand-400",
  "bg-orange-400",
  "bg-amber-400",
  "bg-emerald-500",
];

const OAUTH_ERROR_MESSAGE =
  "La connexion avec Google a échoué. Merci de réessayer.";

export function SignupForm({ oauthError }: { oauthError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<React.ReactNode>(
    oauthError ? OAUTH_ERROR_MESSAGE : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const canSubmit = email.trim().length > 3 && password.length > 0 && agreed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        if (
          signUpError.code === "user_already_exists" ||
          signUpError.code === "email_exists"
        ) {
          setError(
            <>
              Un compte existe déjà avec cet email.{" "}
              <Link
                href="/login"
                className="font-semibold text-brand-600 hover:text-brand-700"
              >
                Connectez-vous plutôt.
              </Link>
            </>
          );
        } else if (signUpError.code === "weak_password") {
          setError(`Mot de passe trop faible : ${signUpError.message}`);
        } else {
          setError("Une erreur est survenue. Merci de réessayer.");
        }
        return;
      }

      // Supabase silently returns a user with no identities instead of an
      // error when the email is already registered (anti-enumeration).
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError(
          <>
            Un compte existe déjà avec cet email.{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Connectez-vous plutôt.
            </Link>
          </>
        );
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // No session means email confirmation is required before sign-in.
      setSuccessMessage(
        "Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse avant de vous connecter."
      );
    } catch {
      setError("Une erreur est survenue. Merci de réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-[2rem] border border-border bg-surface p-7 shadow-[0_30px_70px_-30px_rgba(23,11,13,0.18)] sm:p-9">
      <h2 className="font-display text-2xl font-semibold text-ink">
        Créer un compte
      </h2>
      <p className="mt-1.5 text-sm text-body">
        Accès immédiat à toutes les fonctionnalités
      </p>

      {error && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <GoogleAuthButton
        onError={setError}
        errorRedirectPath="/signup"
      />

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-body-soft">
          ou
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="text-sm font-semibold text-ink"
          >
            Adresse email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-body-soft" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-xl border border-border-strong bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-body-soft/70 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-ink"
          >
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-body-soft" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-border-strong bg-surface pl-11 pr-11 text-sm text-ink placeholder:text-body-soft/70 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-body-soft transition-colors hover:text-ink"
            >
              {showPassword ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          </div>

          {password.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-0.5">
              <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      i < strength.score
                        ? STRENGTH_COLORS[strength.score]
                        : "bg-border"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-body-soft">
                Mot de passe {strength.label.toLowerCase()}
              </span>
            </div>
          )}
        </div>

        <label className="flex items-start gap-3 text-sm text-body">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-strong text-brand-500 accent-brand-500 focus:ring-brand-300"
          />
          <span>
            J&apos;accepte les{" "}
            <a href="#" className="font-semibold text-brand-600 hover:text-brand-700">
              Conditions d&apos;utilisation
            </a>{" "}
            et la{" "}
            <a href="#" className="font-semibold text-brand-600 hover:text-brand-700">
              Politique de confidentialité
            </a>{" "}
            de Polypips.
          </span>
        </label>

        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit || submitting}
          className="w-full"
        >
          {submitting ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : (
            "Créer mon compte"
          )}
        </Button>

        <p className="text-center text-xs leading-relaxed text-body-soft">
          En créant un compte, vous acceptez de recevoir des emails de la
          part de Polypips.
        </p>
      </form>
    </div>
  );
}
