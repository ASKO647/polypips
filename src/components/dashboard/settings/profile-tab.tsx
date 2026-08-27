"use client";

import { useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  CheckCircle2,
  Camera,
  Lock,
  ShieldCheck,
  Smartphone,
  Bell,
  Mail,
  Palette,
  Coins,
  Clock,
  Sparkles,
  Star,
  Wallet,
  Repeat2,
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
import { useDashboardTheme } from "@/providers/dashboard-theme-provider";
import { useCurrency, SUPPORTED_CURRENCIES, type CurrencyCode } from "@/providers/currency-provider";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { PricingPlan } from "@/lib/data/pricing";
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
  const [showNote, setShowNote] = useState(false);
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <InlineActionButton onClick={() => setShowNote(true)}>{label}</InlineActionButton>
      {showNote && <span className="text-[11px] text-dash-text-faint">Bientôt disponible</span>}
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

function RedToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-brand-500" : "bg-dash-surface-strong"
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
          checked && "translate-x-5"
        )}
      />
    </button>
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

const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  trialing: "Essai",
  active: "Actif",
  past_due: "Paiement en échec",
  canceled: "Terminé",
};

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
}) {
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

  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [timezone, setTimezone] = useState("Europe/Paris");

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
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
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
      if (!user) throw new Error("Session expirée, reconnectez-vous.");
      const newUrl = await uploadAvatar(supabase, user.id, file);
      setAvatarUrl(newUrl);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "L'upload a échoué. Réessayez.");
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
      setPrefError(err instanceof Error ? err.message : "Impossible d'enregistrer la devise.");
    }
  };

  const referralLink = `polypips.app/ref/${pseudo.trim() || "vous"}`;
  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(`https://${referralLink}`);
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    } catch (err) {
      console.error("[profile-tab] clipboard write failed", err);
    }
  };

  // Same cut-off rule as SubscriptionTab: a cancellation blurs access
  // immediately, so the CTA switches to "se réabonner" right away.
  const hasAccess =
    (subscription?.status === "active" || subscription?.status === "trialing") &&
    !subscription?.cancelAtPeriodEnd;
  const subscriptionBadgeLabel = subscription?.cancelAtPeriodEnd
    ? "Annulé"
    : subscription
      ? SUBSCRIPTION_STATUS_LABEL[subscription.status]
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
                aria-label="Changer la photo de profil"
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
                  {username || "Utilisateur Polypips"}
                </span>
                {currentPlan && currentPlan.id !== "decouverte" && (
                  <span className="rounded-full bg-brand-500/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-400">
                    Premium
                  </span>
                )}
              </div>
              <span className="text-sm text-dash-text-tertiary">{email}</span>
              {memberSince && (
                <span className="text-xs text-dash-text-quaternary">Membre depuis le {memberSince}</span>
              )}
              <span className="mt-1 inline-flex w-fit items-center gap-1.5 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Compte vérifié
              </span>
            </div>
          </div>
          {avatarError && <p className="mt-3 text-xs text-rose-400">{avatarError}</p>}
        </div>

        <Card title="Informations personnelles">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-fullname" className="text-xs font-medium text-dash-text-tertiary">
              Nom complet
            </label>
            <input
              id="profile-fullname"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setSaved(false);
              }}
              placeholder="Votre nom"
              className="rounded-xl border border-dash-border bg-dash-surface px-4 py-2.5 text-sm text-dash-text placeholder:text-dash-text-faint focus:border-dash-border-strong focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-dash-text-tertiary">Adresse e-mail</label>
            <div className="flex items-center gap-2 rounded-xl border border-dash-border bg-dash-surface-alt px-4 py-2.5">
              <span className="flex-1 truncate text-sm text-dash-text-secondary">{email}</span>
              <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                Vérifié
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-pseudo" className="text-xs font-medium text-dash-text-tertiary">
              Pseudo
            </label>
            <input
              id="profile-pseudo"
              type="text"
              value={pseudo}
              onChange={(e) => {
                setPseudo(e.target.value);
                setSaved(false);
              }}
              placeholder="Votre pseudo"
              className="rounded-xl border border-dash-border bg-dash-surface px-4 py-2.5 text-sm text-dash-text placeholder:text-dash-text-faint focus:border-dash-border-strong focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-language" className="text-xs font-medium text-dash-text-tertiary">
              Langue
            </label>
            <select
              id="profile-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-xl border border-dash-border bg-dash-surface px-4 py-2.5 text-sm text-dash-text focus:border-dash-border-strong focus:outline-none sm:max-w-xs"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            {saved && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Enregistré
              </span>
            )}
            {error && <span className="text-xs text-rose-400">{error}</span>}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="rounded-full border border-rose-400/40 bg-rose-500/[0.06] px-5 py-2 text-sm font-semibold text-rose-300 transition-colors hover:border-rose-400/60 disabled:pointer-events-none disabled:opacity-40"
            >
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </Card>

        <Card title="Sécurité">
          <SecurityRow
            icon={Lock}
            label="Mot de passe"
            value="••••••••••"
            action={<ChangePasswordButtonCompact email={email} />}
          />
          <SecurityRow
            icon={ShieldCheck}
            label="Authentification à deux facteurs"
            value={
              <span className={mfaEnabled ? "text-emerald-400" : "text-dash-text-quaternary"}>
                {mfaEnabled ? "Activée" : "Non activée"}
              </span>
            }
            action={<ComingSoonButton label="Gérer" />}
          />
          <SecurityRow
            icon={Smartphone}
            label="Sessions actives"
            value="1 appareil connecté (celui-ci)"
            action={<ComingSoonButton label="Voir" />}
          />
          <SecurityRow
            icon={GoogleIcon}
            label="Connexion avec Google"
            value={
              <span className={googleConnected ? "text-emerald-400" : "text-dash-text-quaternary"}>
                {googleConnected ? "Connecté" : "Non connecté"}
              </span>
            }
            action={googleConnected ? null : <ComingSoonButton label="Connecter" />}
          />
        </Card>

        <Card title="Préférences">
          <PreferenceRow
            icon={Bell}
            label="Notifications"
            description="Recevoir des alertes et mises à jour"
            control={<RedToggle checked={notifications} onChange={() => setNotifications((v) => !v)} />}
          />
          <PreferenceRow
            icon={Mail}
            label="Alertes par e-mail"
            description="Recevoir les alertes importantes par e-mail"
            control={<RedToggle checked={emailAlerts} onChange={() => setEmailAlerts((v) => !v)} />}
          />
          <PreferenceRow
            icon={Palette}
            label="Thème"
            description="Choisir votre thème d'affichage"
            control={
              <PreferenceSelect
                value={theme}
                onChange={handleThemeChange}
                options={[
                  { value: "dark", label: "Sombre" },
                  { value: "light", label: "Clair" },
                ]}
              />
            }
          />
          <PreferenceRow
            icon={Coins}
            label="Devise"
            description={
              ratesUnavailable && currency !== "EUR"
                ? "Taux de change indisponible — affichage en EUR pour l'instant"
                : "Choisir votre devise d'affichage"
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
            label="Fuseau horaire"
            control={
              <PreferenceSelect
                value={timezone}
                onChange={setTimezone}
                options={[
                  { value: "Europe/Paris", label: "(UTC+01:00) Paris" },
                  { value: "UTC", label: "(UTC+00:00) UTC" },
                  { value: "America/New_York", label: "(UTC-05:00) New York" },
                ]}
              />
            }
          />
        </Card>
      </div>

      {/* Colonne de droite */}
      <div className="flex flex-col gap-6">
        <Card title="Mon abonnement">
          {currentPlan && subscription ? (
            <>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-brand-500/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-brand-400">
                  {currentPlan.id === "pro" ? "Pro" : "Découverte"}
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
                    ? `Accès coupé — période payée jusqu'au ${periodEndLabel}`
                    : `Prochain renouvellement : ${periodEndLabel}`}
                </p>
              )}
              {hasAccess ? (
                <button
                  type="button"
                  onClick={onOpenCancelModal}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  Gérer mon abonnement
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className="flex h-11 w-full items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  Se réabonner
                </Link>
              )}
              <Link
                href="/pricing"
                className="text-center text-sm font-semibold text-brand-400 transition-colors hover:text-brand-300"
              >
                Voir tous les plans →
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-dash-text-tertiary">Vous n&apos;avez pas d&apos;abonnement actif.</p>
              <Link
                href="/pricing"
                className="flex h-11 w-full items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
              >
                Voir les offres
              </Link>
            </>
          )}
        </Card>

        <Card title="Mon activité">
          <ActivityRow icon={Sparkles} label="Analyses effectuées" value={activity.analysesCount} />
          <ActivityRow icon={Star} label="Marchés suivis" value={activity.marketsFollowedCount} />
          <ActivityRow icon={Wallet} label="Smart Wallets suivis" value={activity.walletsFollowedCount} />
          <ActivityRow icon={Repeat2} label="Trades copiés" value={activity.copiedTradesCount} />
          <Link
            href="/dashboard/stats"
            className="mt-1 text-center text-sm font-semibold text-brand-400 transition-colors hover:text-brand-300"
          >
            Voir toutes mes statistiques →
          </Link>
        </Card>

        <Card title="Invitez vos amis">
          <p className="text-sm leading-relaxed text-dash-text-tertiary">
            Le programme de parrainage sera bientôt de retour.
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-dash-border bg-dash-surface-alt px-4 py-2.5">
            <span className="flex-1 truncate text-sm text-dash-text-tertiary">{referralLink}</span>
            <button
              type="button"
              onClick={handleCopyReferral}
              aria-label="Copier le lien d'invitation"
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
              <p className="text-[11px] font-medium text-dash-text-quaternary">Filleuls</p>
              <p className="mt-0.5 text-sm font-bold text-dash-text">0</p>
            </div>
            <div className="rounded-xl border border-dash-border bg-dash-surface-alt px-3 py-2.5">
              <p className="text-[11px] font-medium text-dash-text-quaternary">Gains générés</p>
              <p className="mt-0.5 text-sm font-bold text-dash-text">{formatAmount(0)}</p>
            </div>
          </div>
          <Link
            href="/partners"
            className="text-center text-sm font-semibold text-brand-400 transition-colors hover:text-brand-300"
          >
            En attendant, découvrez notre programme partenaires sur candidature →
          </Link>
        </Card>

        <Card title="Mes outils connectés">
          <div className="flex items-start gap-2.5 text-sm text-dash-text-tertiary">
            <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-dash-text-quaternary" strokeWidth={2} />
            <p>Aucun outil connecté. Connectez vos comptes pour une expérience complète.</p>
          </div>
          <ComingSoonInlineButton label="Gérer les connexions" />
        </Card>

        <Card title="Zone dangereuse" className="border-rose-500/20">
          <h3 className="-mt-2 text-sm font-bold text-rose-400">Supprimer mon compte</h3>
          <p className="text-sm leading-relaxed text-dash-text-tertiary">
            Cette action est irréversible. Toutes vos données seront définitivement supprimées.
          </p>
          {deletionRequested ? (
            <p className="flex items-center gap-2 text-sm font-medium text-dash-text-secondary">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              Demande de suppression enregistrée. Notre équipe vous contactera par email.
            </p>
          ) : (
            <button
              type="button"
              onClick={onOpenDeleteModal}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-rose-500 text-sm font-semibold text-white transition-colors hover:bg-rose-600"
            >
              <TriangleAlert className="h-4 w-4" /> Supprimer mon compte
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
    return <span className="text-xs font-medium text-emerald-400">Email envoyé</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <InlineActionButton onClick={handleClick} disabled={status === "sending"}>
        {status === "sending" ? "Envoi..." : "Modifier"}
      </InlineActionButton>
      {status === "error" && <span className="text-[11px] text-rose-400">Erreur, réessayez</span>}
    </div>
  );
}

function ComingSoonInlineButton({ label }: { label: string }) {
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
      {showNote && <span className="text-xs text-dash-text-faint">Bientôt disponible</span>}
    </div>
  );
}
