"use client";

import { useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import {
  Bell,
  CandlestickChart,
  ChevronDown,
  CircleUserRound,
  LayoutDashboard,
  LineChart,
  Menu,
  Search,
  Sparkles,
  Star,
  Trophy,
  Wallet,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { ProfileMenu } from "@/components/dashboard/profile-menu";
import { useDashboardAvatar } from "@/providers/dashboard-avatar-provider";
import { useDashboardProfileMenu } from "@/providers/dashboard-profile-menu-provider";
import styles from "../overview/dashboard-overview.module.css";

const groups = [
  {
    title: "POLYMARKET",
    color: "#ef2947",
    items: [
      ["Analyse IA", "/dashboard/analyse-ia", Sparkles],
      ["Marchés sélectionnés", "/dashboard/markets", LineChart],
      ["Smart Wallet", "/dashboard/copy-trading", Wallet],
    ],
  },
  {
    title: "SPORT",
    color: "#16b97d",
    items: [
      ["Analyse IA", "/dashboard/sports", Sparkles],
      ["Sélection du jour", "/dashboard/sports/selection", Star],
      ["Mes analyses", "/dashboard/sports/mes-analyses", Trophy],
    ],
  },
  {
    title: "TRADING",
    color: "#f4b400",
    items: [
      ["Analyse IA", "/dashboard/trading", CandlestickChart],
      ["Sélection du jour", "/dashboard/trading/selection", Star],
      ["Mes analyses", "/dashboard/trading/mes-analyses", LineChart],
    ],
  },
] as const;

type DashboardChromeProps = {
  children: ReactNode;
  title: ReactNode;
  firstName?: string | null;
  hideHeader?: boolean;
};

export function DashboardChrome({ children, title, firstName, hideHeader = false }: DashboardChromeProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const avatarUrl = useDashboardAvatar();
  const profile = useDashboardProfileMenu();
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const displayName = firstName || "Polypips";
  const initial = displayName[0].toUpperCase();
  const dashboardLabel = locale === "en" ? "Dashboard" : "Tableau de bord";
  const searchLabel = locale === "en" ? "Search..." : "Rechercher...";

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <div className={styles.app}>
      <aside className={`${styles.sidebar} ${mobile ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}>
          <img src="/polypips-mark.png" alt="" />
          <strong>Polypips</strong>
          <button onClick={() => setMobile(false)} aria-label="Fermer le menu"><X /></button>
        </div>
        <nav>
          <Link href="/dashboard" className={isActive("/dashboard") ? styles.activeNav : ""} onClick={() => setMobile(false)}>
            <LayoutDashboard />{dashboardLabel}
          </Link>
          {groups.map((group, index) => (
            <section key={group.title} className={styles.navGroup} style={{ "--delay": `${110 + index * 45}ms` } as React.CSSProperties}>
              <button className={styles.groupTitle} onClick={() => setCollapsed(value => ({ ...value, [group.title]: !value[group.title] }))}>
                <span style={{ background: group.color }} />
                {group.title}
                {group.title === "TRADING" && <b>NOUVEAU</b>}
                <ChevronDown className={collapsed[group.title] ? styles.chevronClosed : ""} />
              </button>
              <div className={`${styles.groupItems} ${collapsed[group.title] ? styles.groupClosed : ""}`}>
                {group.items.map(([label, href, Icon]) => (
                  <Link key={href} href={href} className={isActive(href) ? styles.activeNav : ""} onClick={() => setMobile(false)}>
                    <Icon />{label}
                  </Link>
                ))}
              </div>
            </section>
          ))}
          <div className={styles.globalLinks}>
            <Link href="/dashboard/settings" className={isActive("/dashboard/settings") ? styles.activeNav : ""} onClick={() => setMobile(false)}><CircleUserRound />Profil</Link>
          </div>
        </nav>
        <ProfileMenu
          displayName={displayName}
          email={profile.email}
          avatarUrl={avatarUrl}
          planLabel={profile.planLabel}
          creditBalance={profile.creditBalance}
          placement="sidebar"
          trigger={({ onClick, open, ariaLabel }) => (
            <button type="button" onClick={onClick} aria-haspopup="menu" aria-expanded={open} aria-label={ariaLabel} className={styles.user}>
              {avatarUrl ? <UserAvatar name={displayName} avatarUrl={avatarUrl} size={44} className={styles.avatar} /> : <span className={styles.avatar}>{initial}</span>}
              <div><strong>{displayName}</strong><small>Compte Polypips Pro</small></div>
            </button>
          )}
        />
      </aside>

      <div className={styles.workspace}>
        {!hideHeader && <header className={styles.header}>
          <button className={styles.mobileToggle} onClick={() => setMobile(true)} aria-label="Ouvrir le menu"><Menu /></button>
          <h2>{title}</h2>
          <div className={styles.headerTools}>
            <label><Search /><input aria-label={searchLabel} placeholder={searchLabel} /></label>
            <button aria-label="Notifications"><Bell /></button>
            <ProfileMenu
              displayName={displayName}
              email={profile.email}
              avatarUrl={avatarUrl}
              planLabel={profile.planLabel}
              creditBalance={profile.creditBalance}
              placement="header"
              trigger={({ onClick, open, ariaLabel }) => (
                <button type="button" onClick={onClick} aria-haspopup="menu" aria-expanded={open} aria-label={ariaLabel} className={styles.avatarTrigger}>
                  {avatarUrl ? <UserAvatar name={displayName} avatarUrl={avatarUrl} size={44} className={styles.avatar} /> : <span className={styles.avatar}>{initial}</span>}
                </button>
              )}
            />
          </div>
        </header>}
        {/* hideHeader pages (Profil) still need a way to reach this sidebar's
            cross-section quick links on mobile — there is no browser back
            button in an installed PWA, and this page supplies no header of
            its own to host the usual toggle. */}
        {hideHeader && <button className={`${styles.mobileToggle} ${styles.floatingToggle}`} onClick={() => setMobile(true)} aria-label="Ouvrir le menu"><Menu /></button>}
        {children}
      </div>
      {mobile && <button className={styles.overlay} aria-label="Fermer" onClick={() => setMobile(false)} />}
    </div>
  );
}
