"use client";

import { useEffect, useRef, useState, useTransition, type ComponentType } from "react";
import { ChevronDown, User, Settings, CreditCard, Palette, Globe, LifeBuoy } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useDashboardTheme } from "@/providers/dashboard-theme-provider";
import { cn } from "@/lib/utils";

function MenuLink({
  href,
  icon: Icon,
  label,
  value,
  onNavigate,
}: {
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value?: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-dash-text-secondary transition-colors hover:bg-dash-surface-alt hover:text-dash-text"
    >
      <Icon className="h-4 w-4 shrink-0 text-dash-text-quaternary" strokeWidth={2} />
      <span className="flex-1">{label}</span>
      {value && <span className="text-xs text-dash-text-quaternary">{value}</span>}
    </Link>
  );
}

/** Header dropdown consolidating everything that used to live under the
 * sidebar's "Ressources" section (Paramètres, FAQ/Support) plus the
 * account identity, plan shortcut, real theme toggle, and language
 * switcher — all in one place instead of scattered across the sidebar.
 * Same click-outside dropdown pattern as NotificationsBell, restyled with
 * dashboard theme tokens rather than the marketing site's LanguageSelector
 * styling (which is locked to forced-light tokens). */
export function ProfileMenu({
  displayName,
  email,
  avatarUrl,
  planLabel,
}: {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  planLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useDashboardTheme();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
    };
  }, [open]);

  const switchLocale = (next: (typeof routing.locales)[number]) => {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu profil"
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-dash-border bg-dash-surface-alt py-1 pl-1 pr-2 transition-colors hover:border-dash-border-strong"
      >
        <UserAvatar name={displayName || email} avatarUrl={avatarUrl} size={32} className="text-xs" />
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-dash-text-tertiary transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-72 max-w-[calc(100vw-2.5rem)] animate-fade-up overflow-hidden rounded-2xl border border-dash-border bg-dash-bg shadow-[0_20px_50px_-16px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center gap-3 border-b border-dash-border px-4 py-3.5">
            <UserAvatar name={displayName || email} avatarUrl={avatarUrl} size={40} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-dash-text">
                {displayName || "Utilisateur Polypips"}
              </span>
              <span className="truncate text-xs text-dash-text-tertiary">{email}</span>
            </div>
          </div>

          <div className="flex flex-col py-1.5">
            <MenuLink href="/dashboard/settings?tab=profile" icon={User} label="Profil" onNavigate={close} />
            <MenuLink
              href="/dashboard/settings?tab=notifications"
              icon={Settings}
              label="Paramètres"
              onNavigate={close}
            />
            <MenuLink
              href="/dashboard/settings?tab=subscription"
              icon={CreditCard}
              label="Plan"
              value={planLabel}
              onNavigate={close}
            />
          </div>

          <div className="flex flex-col gap-2.5 border-t border-dash-border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5 text-sm text-dash-text-secondary">
                <Palette className="h-4 w-4 shrink-0 text-dash-text-quaternary" strokeWidth={2} />
                Thème
              </span>
              <div className="flex rounded-full border border-dash-border p-0.5">
                {(["dark", "light"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTheme(option)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                      theme === option
                        ? "bg-dash-surface-strong text-dash-text"
                        : "text-dash-text-tertiary hover:text-dash-text"
                    )}
                  >
                    {option === "dark" ? "Sombre" : "Clair"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5 text-sm text-dash-text-secondary">
                <Globe className="h-4 w-4 shrink-0 text-dash-text-quaternary" strokeWidth={2} />
                Langue
              </span>
              <div className="flex rounded-full border border-dash-border p-0.5">
                {routing.locales.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => switchLocale(code)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition-colors",
                      code === locale
                        ? "bg-dash-surface-strong text-dash-text"
                        : "text-dash-text-tertiary hover:text-dash-text"
                    )}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-dash-border">
            <Link
              href="/support"
              onClick={close}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-dash-text-secondary transition-colors hover:bg-dash-surface-alt hover:text-dash-text"
            >
              <LifeBuoy className="h-4 w-4 shrink-0 text-dash-text-quaternary" strokeWidth={2} />
              FAQ / Support
            </Link>
          </div>

          <div className="border-t border-dash-border p-3">
            <SignOutButton />
          </div>
        </div>
      )}
    </div>
  );
}
