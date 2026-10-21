"use client";

import { useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button, ButtonIcon } from "@/components/ui/button";
import { LanguageSelector } from "@/components/ui/language-selector";
import { NAV_LINKS } from "@/lib/data/nav";
import introStyles from "@/components/marketing/landing-intro.module.css";

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const getScrolled = () => window.scrollY > 24;
const getServerScrolled = () => false;

export function SiteHeader({ landing = false }: { landing?: boolean }) {
  const [open, setOpen] = useState(false);
  const scrolled = useSyncExternalStore(subscribeToScroll, getScrolled, getServerScrolled);
  const headerRef = useRef<HTMLElement>(null);
  const tNav = useTranslations("Nav");
  const tHeader = useTranslations("Header");

  function followLink(event: MouseEvent<HTMLAnchorElement>, href: string) {
    setOpen(false);
    if (!href.startsWith("#") || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    event.preventDefault();
    window.history.pushState(window.history.state, "", href);
    window.requestAnimationFrame(() => {
      const headerHeight = headerRef.current?.getBoundingClientRect().height ?? 76;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    });
  }

  return (
    <header ref={headerRef} data-scrolled={scrolled} className={`sticky top-0 z-50 border-b border-black/[0.07] bg-surface/90 pt-[var(--safe-top)] backdrop-blur-md ${landing ? introStyles.header : ""}`}>
      <div className="mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href.startsWith("#") ? `/${link.href}` : link.href}
              onClick={(event) => followLink(event, link.href)}
              className="text-sm font-medium text-body transition-colors hover:text-ink"
            >
              {tNav(link.id)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSelector />
          <Link href="/login" className="text-sm font-medium text-body transition-colors hover:text-ink">
            {tHeader("login")}
          </Link>
          <Button href="/signup" size="md" className="h-[52px]">
            {tHeader("cta")} <ButtonIcon>→</ButtonIcon>
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-strong text-ink transition-all duration-150 ease-out hover:scale-105 active:scale-95 lg:hidden"
          aria-label={tHeader(open ? "closeMenu" : "openMenu")}
          aria-expanded={open}
          aria-controls="site-mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div id="site-mobile-menu" className="overflow-x-hidden border-t border-black/[0.07] bg-surface px-6 py-6 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href.startsWith("#") ? `/${link.href}` : link.href}
                onClick={(event) => followLink(event, link.href)}
                className="rounded-lg px-3 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-brand-50"
              >
                {tNav(link.id)}
              </Link>
            ))}
          </nav>
          <div className="mt-5 flex items-center gap-3"><LanguageSelector /></div>
          <Link href="/login" onClick={() => setOpen(false)} className="mt-5 flex items-center justify-center rounded-lg px-3 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-brand-50">
            {tHeader("login")}
          </Link>
          <Button href="/signup" onClick={() => setOpen(false)} size="lg" className="mt-2 w-full">
            {tHeader("cta")} <ButtonIcon>→</ButtonIcon>
          </Button>
        </div>
      )}
    </header>
  );
}
