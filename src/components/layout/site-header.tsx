"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button, ButtonIcon } from "@/components/ui/button";
import { LanguageSelector } from "@/components/ui/language-selector";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NAV_LINKS } from "@/lib/data/nav";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.07] bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-body transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSelector />
          <ThemeToggle />
          <Button href="/signup" size="md" className="h-[52px]">
            Débutez pour 0,99&nbsp;€ <ButtonIcon>→</ButtonIcon>
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-strong text-ink transition-all duration-150 ease-out hover:scale-105 active:scale-95 lg:hidden"
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="overflow-x-hidden border-t border-black/[0.07] bg-surface px-6 py-6 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-brand-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-5 flex items-center gap-3">
            <LanguageSelector />
            <ThemeToggle />
          </div>
          <Button href="/signup" size="lg" className="mt-5 w-full">
            Débutez pour 0,99&nbsp;€ <ButtonIcon>→</ButtonIcon>
          </Button>
        </div>
      )}
    </header>
  );
}
