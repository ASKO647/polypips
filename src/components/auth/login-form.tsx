"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/client";

const OAUTH_ERROR_MESSAGE =
  "La connexion avec Google a échoué. Merci de réessayer.";

export function LoginForm({ oauthError }: { oauthError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    oauthError ? OAUTH_ERROR_MESSAGE : null
  );

  const canSubmit = email.trim().length > 3 && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.code === "invalid_credentials") {
          setError("Email ou mot de passe incorrect.");
        } else {
          setError("Une erreur est survenue. Merci de réessayer.");
        }
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Merci de réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-[2rem] border border-border bg-surface p-7 shadow-[0_30px_70px_-30px_rgba(23,11,13,0.18)] sm:p-9">
      <div className="flex justify-center">
        <Logo />
      </div>

      <h2 className="mt-6 text-center font-display text-2xl font-semibold text-ink">
        Connexion à votre compte
      </h2>
      <p className="mt-1.5 text-center text-sm text-body">
        Accédez à vos analyses IA, Smart Money et paris sélectionnés.
      </p>

      {error && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <GoogleAuthButton onError={setError} errorRedirectPath="/login" />

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-body-soft">
          ou
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label htmlFor="login-email" className="text-sm font-semibold text-ink">
            Adresse e-mail
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-body-soft" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="vous@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-xl border border-border-strong bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-body-soft/70 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="login-password" className="text-sm font-semibold text-ink">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-body-soft" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-border-strong bg-surface pl-11 pr-11 text-sm text-ink placeholder:text-body-soft/70 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
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
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2.5 text-body">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-border-strong text-brand-500 accent-brand-500 focus:ring-brand-300"
            />
            Se souvenir de moi
          </label>
          <Link
            href="/forgot-password"
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" size="lg" disabled={!canSubmit || submitting} className="w-full">
          {submitting ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : (
            "Se connecter →"
          )}
        </Button>

        <p className="text-center text-sm text-body">
          Pas encore de compte ?{" "}
          <Link
            href="/signup"
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            Créer un compte
          </Link>
        </p>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2 border-t border-border pt-6 text-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-500">
          <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.25} />
        </span>
        <p className="text-xs leading-relaxed text-body-soft">
          En continuant, vous acceptez les{" "}
          <a href="#" className="font-semibold text-brand-600 hover:text-brand-700">
            Conditions d&apos;utilisation
          </a>{" "}
          et la{" "}
          <a href="#" className="font-semibold text-brand-600 hover:text-brand-700">
            Politique de confidentialité
          </a>
          .
        </p>
      </div>
    </div>
  );
}
