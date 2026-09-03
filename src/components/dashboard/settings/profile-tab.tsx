"use client";

import { useRef, useState, type ComponentType, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Camera,
  Lock,
  ShieldCheck,
  Smartphone,
  Palette,
  Coins,
  Clock,
  Sparkles,
  Star,
  Wallet,
  Copy,
  Check,
  Link2,
  TriangleAlert,
  Loader2,
} from "lucide-react";
import { GoogleIcon } from "@/components/auth/google-icon";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar, validateAvatarFile } from "@/lib/supabase/avatar";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { SettingsToggle } from "@/components/dashboard/settings/settings-toggle";
import { useDashboardTheme } from "@/providers/dashboard-theme-provider";
import { useCurrency, SUPPORTED_CURRENCIES, type CurrencyCode } from "@/providers/currency-provider";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { PricingPlan } from "@/lib/data/pricing";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/data/settings";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";
import type { ProfileActivityStats } from "@/lib/supabase/profile-activity";

/** One rounded card, used for every block on this page — same tokens as
 * the tab container itself. Dashboard-theme-aware (dark by default, real
 * light mode once the user switches it in Préférences or the header
 * menu). */
function Card({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-dash-border bg-dash-surface p-5 sm:p-6", className)}>
      <h2 className="font-display text-base font-bold text-dash-text">{title}</h2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </div>
  );
}

/** A single "icon · label · value/status · action" line in the Sécurité
 * card. */
function SecurityRow({
  icon: Icon,
  label,
  value,
  action,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: ReactNode;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dash-border bg-dash-surface-alt px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dash-surface-strong text-dash-text-tertiary">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-dash-text">{label}</span>
          <span className="text-xs text-dash-text-quaternary">{value}</span>
        </div>
      </div>
      {action}
    </div>
  );
}

/** Outline pill button reused for every small inline action in this page
 * (Modifier / Gérer / Voir) — dashboard-native styling, deliberately not
 * the marketing Button component, which renders a white pill unsuited to
 * this UI. */
function InlineActionButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 rounded-full border border-dash-border-strong px-4 py-1.5 text-xs font-semibold text-dash-text-secondary transition-colors hover:border-dash-text-quaternary hover:text-dash-text disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/** No self-serve flow exists yet for 2FA enrollment, session management or
 * external tool connections — clicking shows an honest "not built yet"
 * note instead of a button that silently does nothing. */
function ComingSoonButton({ label }: { label: string }) {
  const t = useTranslations("Profile.ProfileTab");
  const [showNote, setShowNote] = useState(false);
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <InlineActionButton onClick={() => setShowNote(true)}>{label}</InlineActionButton>
      {showNote && <span className="text-[11px] text-dash-text-faint">{t("comingSoon")}</span>}
    </div>
  );
}

function PreferenceRow({
  icon: Icon,
  label,
  description,
  control,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  description?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dash-border bg-dash-surface-alt px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dash-surface-strong text-dash-text-tertiary">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-dash-text">{label}</span>
          {description && <span className="text-xs text-dash-text-quaternary">{description}</span>}
        </div>
      </div>
      {control}
    </div>
  );
}

function PreferenceSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="shrink-0 rounded-lg border border-dash-border bg-dash-surface-alt px-3 py-1.5 text-xs font-semibold text-dash-text focus:border-dash-border-strong focus:outline-none disabled:opacity-50"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function ActivityRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2.5 text-sm text-dash-text-secondary">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dash-surface-strong text-dash-text-tertiary">
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        {label}
      </span>
      <span className="text-sm font-bold text-dash-text">{value}</span>
    </div>
  );
}

type ProfileTranslator = ReturnType<typeof useTranslations>;

function getSubscriptionStatusLabel(
  t: ProfileTranslator,
  status: string
): string | undefined {
  const labels: Record<string, string> = {
    trialing: t("subscription.statusTrialing"),
    active: t("subscription.statusActive"),
    past_due: t("subscription.statusPastDue"),
    canceled: t("subscription.statusCanceled"),
  };
  return labels[status];
}

export function ProfileTab({
  email,
  initialUsername,
  initialPseudo,
  initialAvatarUrl,
  memberSince,
  googleConnected,
  mfaEnabled,
  currentPlan,
  subscription,
  periodEndLabel,
  activity,
  onOpenCancelModal,
  onOpenDeleteModal,
  deletionRequested,
  actionError,
}: {
  email: string;
  initialUsername: string;
  initialPseudo: string;
  initialAvatarUrl: string | null;
  /** Formatted "12 mars 2024", or null if unavailable. */
  memberSince: string | null;
  googleConnected: boolean;
  mfaEnabled: boolean;
  currentPlan: PricingPlan | null;
  subscription: SubscriptionRow | null;
  periodEndLabel: string | null;
  activity: ProfileActivityStats;
  onOpenCancelModal: () => void;
  onOpenDeleteModal: () => void;
  deletionRequested: boolean;
  /** Set only when a cancel-subscription attempt (triggered via
   * onOpenCancelModal's modal) just failed. */
  actionError: string | null;
}) {
  const t = useTranslations("Profile.ProfileTab");
  const [username, setUsername] = useState(initialUsername);
  const [pseudo, setPseudo] = useState(initialPseudo);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [language, setLanguage] = useState("fr");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [notificationPrefs, setNotificationPrefs] = useState(DEFAULT_NOTIFICATION_PREFERENCES);
  const [timezone, setTimezone] = useState("Europe/Paris");

  const toggleNotificationPref = (id: string) => {
    setNotificationPrefs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  };

  const { theme, setTheme } = useDashboardTheme();
  const { currency, setCurrency, formatAmount, ratesUnavailable } = useCurrency();
  const [prefError, setPrefError] = useState<string | null>(null);

  const [referralCopied, setReferralCopied] = useState(false);

  const dirty = username !== initialUsername || pseudo !== initialPseudo;

  const handleSave = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: username.trim(), username: pseudo.trim() },
      });
      if (updateError) throw new Error(updateError.message);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("personalInfo.genericError"));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setAvatarError(validationError);
      return;
    }

    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("avatarSessionExpired"));
      const newUrl = await uploadAvatar(supabase, user.id, file);
      setAvatarUrl(newUrl);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : t("avatarUploadFailed"));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleThemeChange = (next: string) => {
    setTheme(next === "light" ? "light" : "dark");
  };

  const handleCurrencyChange = async (next: string) => {
    setPrefError(null);
    try {
      await setCurrency(next as CurrencyCode);
    } catch (err) {
      setPrefError(err instanceof Error ? err.message : t("preferences.currencyError"));
    }
  };

  const referralLink = `polypips.app/ref/${pseudo.trim() || t("referral.fallbackPseudo")}`;
  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(`https://${referralLink}`);
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    } catch (err) {
      console.error("[profile-tab] clipboard write failed", err);
    }
  };

  // A cancellation blurs access immediately (see hasActiveAccess in
  // lib/supabase/subscriptions.ts), so the CTA switches to "se réabonner"
  // right away rather than waiting for the paid period to actually end.
  const hasAccess =
    (subscription?.status === "active" || subscription?.status === "trialing") &&
    !subscription?.cancelAtPeriodEnd;
  const subscriptionBadgeLabel = subscription?.cancelAtPeriodEnd
    ? t("subscription.statusCancelledSoon")
    : subscription
      ? getSubscriptionStatusLabel(t, subscription.status)
      : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      {/* Colonne de gauche */}
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-dash-border bg-dash-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-5">
            <div className="relative shrink-0">
              <UserAvatar name={username || email} avatarUrl={avatarUrl} size={80} className="text-2xl" />
              <button
                type="button"
                onClick={handleAvatarPick}
                disabled={avatarUploading}
                aria-label={t("changeAvatarAria")}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-dash-bg bg-dash-surface-strong text-dash-text-secondary transition-colors hover:text-dash-text disabled:pointer-events-none"
              >
                {avatarUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                ) : (
                  <Camera className="h-3.5 w-3.5" strokeWidth={2} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-lg font-bold text-dash-text">
                  {username || t("defaultUsername")}
                </span>
                {currentPlan && currentPlan.id !== "decouverte" && (
                  <span className="rounded-full bg-brand-500/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-400">
                    {t("premiumBadge")}
                  </span>
                )}
              </div>
              <span className="text-sm text-dash-text-tertiary">{email}</span>
              {memberSince && (
                <span className="text-xs text-dash-text-quaternary">{t("memberSince", { date: memberSince })}</span>
              )}
              <span className="mt-1 inline-flex w-fit items-center gap-1.5 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> {t("verifiedAccount")}
              </span>
            </div>
          </div>
          {avatarError && <p className="mt-3 text-xs text-rose-400">{avatarError}</p>}
        </div>

        <Card title={t("personalInfo.title")}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-fullname" className="text-xs font-medium text-dash-text-tertiary">
              {t("personalInfo.fullNameLabel")}
            </label>
            <input
              id="profile-fullname"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setSaved(false);
              }}
              placeholder={t("personalInfo.fullNamePlaceholder")}
              className="rounded-xl border border-dash-border bg-dash-surface px-4 py-2.5 text-sm text-dash-text placeholder:text-dash-text-faint focus:border-dash-border-strong focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-dash-text-tertiary">{t("personalInfo.emailLabel")}</label>
            <div className="flex items-center gap-2 rounded-xl border border-dash-border bg-dash-surface-alt px-4 py-2.5">
              <span className="flex-1 truncate text-sm text-dash-text-secondary">{email}</span>
              <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                {t("personalInfo.emailVerifiedBadge")}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-pseudo" className="text-xs font-medium text-dash-text-tertiary">
              {t("personalInfo.pseudoLabel")}
            </label>
            <input
              id="profile-pseudo"
              type="text"
              value={pseudo}
              onChange={(e) => {
                setPseudo(e.target.value);
                setSaved(false);
              }}
              placeholder={t("personalInfo.pseudoPlaceholder")}
              className="rounded-xl border border-dash-border bg-dash-surface px-4 py-2.5 text-sm text-dash-text placeholder:text-dash-text-faint focus:border-dash-border-strong focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-language" className="text-xs font-medium text-dash-text-tertiary">
              {t("personalInfo.languageLabel")}
            </label>
            <select
              id="profile-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-xl border border-dash-border bg-dash-surface px-4 py-2.5 text-sm text-dash-text focus:border-dash-border-strong focus:outline-none sm:max-w-xs"
            >
              <option value="fr">{t("personalInfo.languageFr")}</option>
              <option value="en">{t("personalInfo.languageEn")}</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            {saved && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> {t("personalInfo.saved")}
              </span>
            )}
            {error && <span className="text-xs text-rose-400">{error}</span>}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="rounded-full border border-rose-400/40 bg-rose-500/[0.06] px-5 py-2 text-sm font-semibold text-rose-300 transition-colors hover:border-rose-400/60 disabled:pointer-events-none disabled:opacity-40"
            >
              {saving ? t("personalInfo.saving") : t("personalInfo.save")}
            </button>
          </div>
        </Card>

        <Card title={t("security.title")}>
          <SecurityRow
            icon={Lock}
            label={t("security.passwordLabel")}
            value="••••••••••"
            action={<ChangePasswordButtonCompact email={email} />}
          />
          <SecurityRow
            icon={ShieldCheck}
            label={t("security.twoFactorLabel")}
            value={
              <span className={mfaEnabled ? "text-emerald-400" : "text-dash-text-quaternary"}>
                {mfaEnabled ? t("security.twoFactorEnabled") : t("security.twoFactorDisabled")}
              </span>
            }
            action={<ComingSoonButton label={t("security.manage")} />}
          />
          <SecurityRow
            icon={Smartphone}
            label={t("security.activeSessionsLabel")}
            value={t("security.activeSessionsValue")}
            action={<ComingSoonButton label={t("security.view")} />}
          />
          <SecurityRow
            icon={GoogleIcon}
            label={t("security.googleLabel")}
            value={
              <span className={googleConnected ? "text-emerald-400" : "text-dash-text-quaternary"}>
                {googleConnected ? t("security.googleConnected") : t("security.googleNotConnected")}
              </span>
            }
            action={googleConnected ? null : <ComingSoonButton label={t("security.connect")} />}
          />
        </Card>

        <Card title={t("notifications.title")}>
          {notificationPrefs.map((pref) => (
            <SettingsToggle
              key={pref.id}
              label={t(`notifications.prefs.${pref.id}`)}
              checked={pref.enabled}
              onChange={() => toggleNotificationPref(pref.id)}
            />
          ))}
        </Card>

        <Card title={t("preferences.title")}>
          <PreferenceRow
            icon={Palette}
            label={t("preferences.themeLabel")}
            description={t("preferences.themeDescription")}
            control={
              <PreferenceSelect
                value={theme}
                onChange={handleThemeChange}
                options={[
                  { value: "dark", label: t("preferences.themeDark") },
                  { value: "light", label: t("preferences.themeLight") },
                ]}
              />
            }
          />
          <PreferenceRow
            icon={Coins}
            label={t("preferences.currencyLabel")}
            description={
              ratesUnavailable && currency !== "EUR"
                ? t("preferences.currencyRatesUnavailable")
                : t("preferences.currencyDescription")
            }
            control={
              <PreferenceSelect
                value={currency}
                onChange={handleCurrencyChange}
                options={SUPPORTED_CURRENCIES.map((c) => ({ value: c.code, label: c.label }))}
              />
            }
          />
          {prefError && <p className="text-xs text-rose-400">{prefError}</p>}
          <PreferenceRow
            icon={Clock}
            label={t("preferences.timezoneLabel")}
            control={
              <PreferenceSelect
                value={timezone}
                onChange={setTimezone}
                options={[
                  { value: "Europe/Paris", label: t("preferences.timezoneParis") },
                  { value: "UTC", label: t("preferences.timezoneUtc") },
                  { value: "America/New_York", label: t("preferences.timezoneNewYork") },
                ]}
              />
            }
          />
        </Card>
      </div>

      {/* Colonne de droite */}
      <div className="flex flex-col gap-6">
        <Card title={t("subscription.title")}>
          {currentPlan && subscription ? (
            <>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-brand-500/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-brand-400">
                  {currentPlan.id === "pro" ? t("subscription.planPro") : t("subscription.planDecouverte")}
                </span>
                <span className="font-display text-xl font-bold text-dash-text">
                  {formatAmount(currentPlan.priceEur)}
                  <span className="text-sm font-medium text-dash-text-tertiary"> {currentPlan.priceSuffix}</span>
                </span>
              </div>
              {subscriptionBadgeLabel && (
                <span className="w-fit rounded-full bg-dash-surface-strong px-2.5 py-1 text-[11px] font-semibold text-dash-text-secondary">
                  {subscriptionBadgeLabel}
                </span>
              )}
              {periodEndLabel && (
                <p className="text-xs text-dash-text-quaternary">
                  {subscription.cancelAtPeriodEnd
                    ? t("subscription.accessCutOff", { date: periodEndLabel })
                    : t("subscription.nextRenewal", { date: periodEndLabel })}
                </p>
              )}
              {actionError && <p className="text-xs text-rose-400">{actionError}</p>}
              {hasAccess ? (
                <button
                  type="button"
                  onClick={onOpenCancelModal}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  {t("subscription.manage")}
                </button>
              ) : (
                <Link
                  href="/dashboard/subscription"
                  className="flex h-11 w-full items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  {t("subscription.resubscribe")}
                </Link>
              )}
              <Link
                href="/dashboard/subscription"
                className="text-center text-sm font-semibold text-brand-400 transition-colors hover:text-brand-300"
              >
                {t("subscription.viewAll")}
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-dash-text-tertiary">{t("subscription.noActive")}</p>
              <Link
                href="/dashboard/subscription"
                className="flex h-11 w-full items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
              >
                {t("subscription.viewPlans")}
              </Link>
            </>
          )}
        </Card>

        <Card title={t("activity.title")}>
          <ActivityRow icon={Sparkles} label={t("activity.analysesDone")} value={activity.analysesCount} />
          <ActivityRow icon={Star} label={t("activity.marketsFollowed")} value={activity.marketsFollowedCount} />
          <ActivityRow icon={Wallet} label={t("activity.walletsFollowed")} value={activity.walletsFollowedCount} />
        </Card>

        <Card title={t("referral.title")}>
          <p className="text-sm leading-relaxed text-dash-text-tertiary">
            {t("referral.comingBack")}
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-dash-border bg-dash-surface-alt px-4 py-2.5">
            <span className="flex-1 truncate text-sm text-dash-text-tertiary">{referralLink}</span>
            <button
              type="button"
              onClick={handleCopyReferral}
              aria-label={t("referral.copyAria")}
              className="shrink-0 text-dash-text-tertiary transition-colors hover:text-dash-text"
            >
              {referralCopied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-dash-border bg-dash-surface-alt px-3 py-2.5">
              <p className="text-[11px] font-medium text-dash-text-quaternary">{t("referral.referrals")}</p>
              <p className="mt-0.5 text-sm font-bold text-dash-text">0</p>
            </div>
            <div className="rounded-xl border border-dash-border bg-dash-surface-alt px-3 py-2.5">
              <p className="text-[11px] font-medium text-dash-text-quaternary">{t("referral.earnings")}</p>
              <p className="mt-0.5 text-sm font-bold text-dash-text">{formatAmount(0)}</p>
            </div>
          </div>
          <Link
            href="/partners"
            className="text-center text-sm font-semibold text-brand-400 transition-colors hover:text-brand-300"
          >
            {t("referral.partnersCta")}
          </Link>
        </Card>

        <Card title={t("connectedTools.title")}>
          <div className="flex items-start gap-2.5 text-sm text-dash-text-tertiary">
            <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-dash-text-quaternary" strokeWidth={2} />
            <p>{t("connectedTools.empty")}</p>
          </div>
          <ComingSoonInlineButton label={t("connectedTools.manage")} />
        </Card>

        <Card title={t("dangerZone.title")} className="border-rose-500/20">
          <h3 className="-mt-2 text-sm font-bold text-rose-400">{t("dangerZone.deleteTitle")}</h3>
          <p className="text-sm leading-relaxed text-dash-text-tertiary">
            {t("dangerZone.deleteDescription")}
          </p>
          {deletionRequested ? (
            <p className="flex items-center gap-2 text-sm font-medium text-dash-text-secondary">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              {t("dangerZone.deletionRequested")}
            </p>
          ) : (
            <button
              type="button"
              onClick={onOpenDeleteModal}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-rose-500 text-sm font-semibold text-white transition-colors hover:bg-rose-600"
            >
              <TriangleAlert className="h-4 w-4" /> {t("dangerZone.deleteButton")}
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}

/** Same resetPasswordForEmail flow as ChangePasswordButton, restyled as a
 * compact inline pill so it fits the Sécurité row instead of a full-width
 * button — kept as a thin wrapper rather than modifying the shared
 * component, since ChangePasswordButton is also used standalone on the
 * "Mot de passe" tab with its original styling. */
function ChangePasswordButtonCompact({ email }: { email: string }) {
  const t = useTranslations("Profile.ProfileTab.changePasswordCompact");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleClick = async () => {
    if (status === "sending") return;
    setStatus("sending");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setStatus(error ? "error" : "sent");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return <span className="text-xs font-medium text-emerald-400">{t("sent")}</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <InlineActionButton onClick={handleClick} disabled={status === "sending"}>
        {status === "sending" ? t("sending") : t("modify")}
      </InlineActionButton>
      {status === "error" && <span className="text-[11px] text-rose-400">{t("error")}</span>}
    </div>
  );
}

function ComingSoonInlineButton({ label }: { label: string }) {
  const t = useTranslations("Profile.ProfileTab");
  const [showNote, setShowNote] = useState(false);
  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={() => setShowNote(true)}
        className="rounded-full border border-dash-border-strong px-4 py-2 text-sm font-semibold text-dash-text-secondary transition-colors hover:border-dash-text-quaternary hover:text-dash-text"
      >
        {label}
      </button>
      {showNote && <span className="text-xs text-dash-text-faint">{t("comingSoon")}</span>}
    </div>
  );
}
