"use client";

import { useEffect, useRef, useState, useTransition, type ComponentType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, User, CreditCard, BrainCircuit, Palette, Globe, LifeBuoy } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useDashboardTheme } from "@/providers/dashboard-theme-provider";
import { useDashboardProfileMenu, type ProfileMenuPlacement } from "@/providers/dashboard-profile-menu-provider";
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
      className="flex min-h-11 items-center gap-3 px-4 py-2.5 text-sm text-dash-text-secondary transition-colors hover:bg-dash-surface-alt hover:text-dash-text"
    >
      <Icon className="h-4 w-4 shrink-0 text-dash-text-quaternary" strokeWidth={2} />
      <span className="flex-1">{label}</span>
      {value && <span className="text-xs text-dash-text-quaternary">{value}</span>}
    </Link>
  );
}

/** Header dropdown — quick shortcuts to the Profil page (now a single
 * merged page, no more tabs — see settings-flow.tsx) and its subscription
 * page, FAQ/Support, plus the account identity, real theme toggle, and
 * language switcher, all in one place instead of scattered across the
 * sidebar. Same click-outside dropdown pattern as NotificationsBell,
 * restyled with dashboard theme tokens rather than the marketing site's
 * LanguageSelector styling (which is locked to forced-light tokens). */
export function ProfileMenu({
  displayName,
  email,
  avatarUrl,
  planLabel,
  creditBalance,
  placement = "header",
  trigger,
}: {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  planLabel: string;
  /** Current Deep Analysis credit balance — shown next to the plan badge,
   * per the credits system's "always visible somewhere in the dashboard"
   * requirement. */
  creditBalance: number;
  /** "header" opens the panel downward from a top-of-screen trigger
   * (unchanged default). "sidebar" opens it upward from a bottom-of-screen
   * trigger so it stays fully on-screen. */
  placement?: ProfileMenuPlacement;
  /** Lets each mount point keep its own existing trigger visual (pill
   * button, bare avatar circle, full name+subtitle row) instead of forcing
   * them all to look like the default pill — the panel and its open/close
   * logic stay shared regardless. Receives a ready-made onClick/aria-label
   * so callers never duplicate that wiring. */
  trigger?: (args: { onClick: () => void; open: boolean; ariaLabel: string }) => ReactNode;
}) {
  const t = useTranslations("Dashboard.ProfileMenu");
  const tCredits = useTranslations("Credits");
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useDashboardTheme();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { openPlacement, setOpenPlacement } = useDashboardProfileMenu();
  const open = openPlacement === placement;

  // The panel is portaled to <body> (see below) so it escapes any ancestor
  // that creates a containing block for fixed-position descendants —
  // DashboardHeader and the immersive chrome header both use
  // backdrop-filter, which does exactly that, so a plain CSS-anchored
  // `position: fixed` panel nested inside them would measure its offsets
  // against the header's box instead of the real viewport. Being portaled,
  // it needs its own on-screen position computed in JS instead of Tailwind
  // classes anchored to the trigger.
  const [isMobile, setIsMobile] = useState(false);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left?: number; right?: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open || isMobile) return;
    const measure = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      setCoords(
        placement === "sidebar"
          ? { bottom: window.innerHeight - rect.top + 10, left: rect.left }
          : { top: rect.bottom + 10, right: window.innerWidth - rect.right }
      );
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, isMobile, placement]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpenPlacement(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPlacement(null);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpenPlacement]);

  const switchLocale = (next: (typeof routing.locales)[number]) => {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  const close = () => setOpenPlacement(null);
  const toggle = () => setOpenPlacement(open ? null : placement);
  const ariaLabel = t("ariaLabel");

  return (
    <div ref={ref} className={cn(placement === "sidebar" && "w-full")}>
      {trigger ? (
        trigger({ onClick: toggle, open, ariaLabel })
      ) : (
        <button
          type="button"
          onClick={toggle}
          aria-label={ariaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex min-h-11 items-center gap-1.5 rounded-full border border-dash-border bg-dash-surface-alt py-1 pl-1 pr-2 transition-colors hover:border-dash-border-strong"
        >
          <UserAvatar name={displayName || email} avatarUrl={avatarUrl} size={32} className="text-xs" />
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-dash-text-tertiary transition-transform duration-150",
              open && "rotate-180"
            )}
          />
        </button>
      )}

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            style={isMobile ? undefined : (coords ?? undefined)}
            className={cn(
              "fixed z-50 w-72 max-w-[calc(100vw-2.5rem)] max-h-[min(32rem,calc(100dvh-5rem))] overflow-y-auto animate-fade-up rounded-2xl border border-dash-border bg-dash-bg shadow-[0_20px_50px_-16px_rgba(0,0,0,0.6)]",
              isMobile &&
                "inset-x-0 bottom-0 top-auto left-auto right-auto w-full max-w-none rounded-b-none rounded-t-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))]",
              !isMobile && !coords && "invisible"
            )}
          >
          <div className="flex items-center gap-3 border-b border-dash-border px-4 py-3.5">
            <UserAvatar name={displayName || email} avatarUrl={avatarUrl} size={40} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-dash-text">
                {displayName || t("defaultUserName")}
              </span>
              <span className="truncate text-xs text-dash-text-tertiary">{email}</span>
            </div>
          </div>

          <div className="flex flex-col py-1.5">
            <MenuLink href="/dashboard/settings" icon={User} label={t("profil")} onNavigate={close} />
            <MenuLink
              href="/dashboard/subscription"
              icon={CreditCard}
              label={t("subscription")}
              value={planLabel}
              onNavigate={close}
            />
            <MenuLink
              href="/dashboard/credits"
              icon={BrainCircuit}
              label={tCredits("title")}
              value={`${creditBalance} ${tCredits("balanceUnit", { count: creditBalance })}`}
              onNavigate={close}
            />
          </div>

          <div className="flex flex-col gap-2.5 border-t border-dash-border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5 text-sm text-dash-text-secondary">
                <Palette className="h-4 w-4 shrink-0 text-dash-text-quaternary" strokeWidth={2} />
                {t("theme")}
              </span>
              <div className="flex rounded-full border border-dash-border p-0.5">
                {(["dark", "light"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTheme(option)}
                    className={cn(
                      "min-h-11 rounded-full px-2.5 text-xs font-semibold transition-colors",
                      theme === option
                        ? "bg-dash-surface-strong text-dash-text"
                        : "text-dash-text-tertiary hover:text-dash-text"
                    )}
                  >
                    {option === "dark" ? t("dark") : t("light")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5 text-sm text-dash-text-secondary">
                <Globe className="h-4 w-4 shrink-0 text-dash-text-quaternary" strokeWidth={2} />
                {t("language")}
              </span>
              <div className="flex rounded-full border border-dash-border p-0.5">
                {routing.locales.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => switchLocale(code)}
                    className={cn(
                      "min-h-11 rounded-full px-2.5 text-xs font-semibold uppercase transition-colors",
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
              className="flex min-h-11 items-center gap-3 px-4 py-2.5 text-sm text-dash-text-secondary transition-colors hover:bg-dash-surface-alt hover:text-dash-text"
            >
              <LifeBuoy className="h-4 w-4 shrink-0 text-dash-text-quaternary" strokeWidth={2} />
              {t("faqSupport")}
            </Link>
          </div>

          <div className="border-t border-dash-border p-3">
            <SignOutButton />
          </div>
          </div>,
          document.body
        )}
    </div>
  );
}
