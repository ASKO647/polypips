"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Tag,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { getPasswordStrength } from "@/lib/password-strength";
import { createClient } from "@/lib/supabase/client";
import { isPlanId } from "@/lib/stripe/plans";
import { readStoredAttribution } from "@/lib/attribution/capture";
import { recordSignupSource } from "@/lib/supabase/signup-sources";
import { applyInfluencerCode } from "@/lib/influencers/check-code-action";
import { readInfluencerAttribution } from "@/lib/influencers/attribution";
import { recordInfluencerReferral } from "@/lib/supabase/influencer-referrals";
import { cn } from "@/lib/utils";

const STRENGTH_COLORS = [
  "bg-border-strong",
  "bg-brand-400",
  "bg-orange-400",
  "bg-amber-400",
  "bg-emerald-500",
];

const STRENGTH_KEYS = [
  "veryWeak",
  "weak",
  "medium",
  "strong",
  "veryStrong",
] as const;

export function SignupForm({
  oauthError,
  plan,
}: {
  oauthError?: string;
  /** Plan the user picked on the pricing section before being sent here to
   * create an account — once signed in they're sent straight to that
   * plan's Checkout instead of the plain dashboard. */
  plan?: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Auth.Signup");
  const tAuth = useTranslations("Auth");
  const next = plan && isPlanId(plan) ? `/dashboard?checkout=${plan}` : undefined;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoCodeStatus, setPromoCodeStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");
  const [error, setError] = useState<React.ReactNode>(
    oauthError ? tAuth("oauthError") : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const canSubmit = email.trim().length > 3 && password.length > 0 && agreed;

  // Sets the influencer attribution cookie the moment a valid code is
  // confirmed — well before signUp() runs, so it's already there by
  // recordInfluencerReferral time in either branch below (immediate
  // session, or /auth/callback after email confirmation). Also runs once
  // more at submit time if the field still hasn't resolved (e.g. no blur
  // event, browser autofill) so a valid code is never silently dropped.
  const checkPromoCode = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setPromoCodeStatus("idle");
      return;
    }
    setPromoCodeStatus("checking");
    const { valid } = await applyInfluencerCode(trimmed);
    setPromoCodeStatus(valid ? "valid" : "invalid");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      if (promoCode.trim() && promoCodeStatus !== "valid" && promoCodeStatus !== "invalid") {
        await checkPromoCode(promoCode);
      }

      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: next
            ? `${window.location.origin}/auth/callback?locale=${locale}&next=${encodeURIComponent(next)}`
            : `${window.location.origin}/auth/callback?locale=${locale}`,
        },
      });

      if (signUpError) {
        if (
          signUpError.code === "user_already_exists" ||
          signUpError.code === "email_exists"
        ) {
          setError(
            <>
              {t("alreadyHaveAccount")}{" "}
              <Link
                href="/login"
                className="font-semibold text-brand-600 hover:text-brand-700"
              >
                {t("loginInstead")}
              </Link>
            </>
          );
        } else if (signUpError.code === "weak_password") {
          setError(`${t("weakPasswordPrefix")} ${signUpError.message}`);
        } else {
          console.error("[signup] signUp failed", {
            code: signUpError.code,
            status: signUpError.status,
            message: signUpError.message,
          });
          setError(signUpError.message || tAuth("errorGeneric"));
        }
        return;
      }

      // Supabase silently returns a user with no identities instead of an
      // error when the email is already registered (anti-enumeration).
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError(
          <>
            {t("alreadyHaveAccount")}{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              {t("loginInstead")}
            </Link>
          </>
        );
        return;
      }

      if (data.session) {
        // Only reached when email confirmation is disabled — the user is
        // already authenticated, so this is the one signup path that
        // never touches /auth/callback and has to record attribution
        // itself instead.
        const attribution = readStoredAttribution();
        if (attribution && data.user) {
          await recordSignupSource(supabase, data.user.id, attribution);
        }
        const influencerAttribution = readInfluencerAttribution();
        if (influencerAttribution && data.user) {
          await recordInfluencerReferral(supabase, data.user.id, influencerAttribution);
        }
        router.push(next ?? "/dashboard");
        router.refresh();
        return;
      }

      // No session means email confirmation is required before sign-in.
      setSuccessMessage(t("successMessage"));
    } catch {
      setError(tAuth("errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-[2rem] border border-border bg-surface p-7 shadow-[0_30px_70px_-30px_rgba(23,11,13,0.18)] sm:p-9">
      <h2 className="font-display text-2xl font-semibold text-ink">
        {t("cardTitle")}
      </h2>
      <p className="mt-1.5 text-sm text-body">
        {t("cardSubtitle")}
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
        next={next}
      />

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-body-soft">
          {tAuth("or")}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="text-sm font-semibold text-ink"
          >
            {t("emailLabel")}
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-body-soft" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
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
            {t("passwordLabel")}
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-body-soft" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-border-strong bg-surface pl-11 pr-11 text-sm text-ink placeholder:text-body-soft/70 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword
                  ? tAuth("hidePassword")
                  : tAuth("showPassword")
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
                {t("passwordStrengthPrefix")}{" "}
                {tAuth(`PasswordStrength.${STRENGTH_KEYS[strength.score]}`)}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="promo-code" className="text-sm font-semibold text-ink">
            {t("promoCodeLabel")}{" "}
            <span className="font-normal text-body-soft">{t("promoCodeOptional")}</span>
          </label>
          <div className="relative">
            <Tag className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-body-soft" />
            <input
              id="promo-code"
              type="text"
              autoComplete="off"
              placeholder={t("promoCodePlaceholder")}
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                setPromoCodeStatus("idle");
              }}
              onBlur={(e) => checkPromoCode(e.target.value)}
              className="h-12 w-full rounded-xl border border-border-strong bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-body-soft/70 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          {promoCodeStatus === "valid" && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> {t("promoCodeValid")}
            </span>
          )}
          {promoCodeStatus === "invalid" && (
            <span className="text-xs font-medium text-body-soft">
              {t("promoCodeInvalid")}
            </span>
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
            {t("termsPrefix")}{" "}
            <a href="#" className="font-semibold text-brand-600 hover:text-brand-700">
              {tAuth("terms")}
            </a>{" "}
            {t("termsAnd")}{" "}
            <a href="#" className="font-semibold text-brand-600 hover:text-brand-700">
              {tAuth("privacy")}
            </a>{" "}
            {t("termsSuffix")}
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
            t("submit")
          )}
        </Button>

        <p className="text-center text-xs leading-relaxed text-body-soft">
          {t("emailNotice")}
        </p>
      </form>
    </div>
  );
}
