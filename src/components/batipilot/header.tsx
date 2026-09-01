"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Menu, X, Zap } from "lucide-react";
import { NAV_LINKS } from "@/lib/data/batipilot";
import { cn } from "@/lib/utils";

export function BatipilotHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#04060d]/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between px-6 lg:px-8">
        <a href="#hero" className="inline-flex items-center gap-2.5" aria-label="BatiPilot — accueil">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_20px_rgba(34,211,238,0.45)]">
            <Zap className="h-5 w-5 text-[#04060d]" strokeWidth={2.5} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-white">
            Bati<span className="text-cyan-400">Pilot</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Se connecter
          </Link>
          <a
            href="#contact"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 text-sm font-semibold text-[#04060d] shadow-[0_0_24px_rgba(34,211,238,0.35)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(34,211,238,0.5)] active:translate-y-0"
          >
            Demander une démo
          </a>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition-all duration-150 ease-out hover:scale-105 hover:border-cyan-400/50 active:scale-95 lg:hidden"
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-white/[0.08] bg-[#04060d] px-6 transition-[max-height] duration-300 ease-out lg:hidden",
          open ? "max-h-[420px] py-6" : "max-h-0 py-0"
        )}
      >
        <nav className="flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-[15px] font-medium text-white/85 transition-colors hover:bg-white/[0.06]"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <Link
          href="/login"
          onClick={() => setOpen(false)}
          className="mt-3 flex items-center justify-center rounded-lg px-3 py-3 text-[15px] font-medium text-white/85 transition-colors hover:bg-white/[0.06]"
        >
          Se connecter
        </Link>
        <a
          href="#contact"
          onClick={() => setOpen(false)}
          className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-sm font-semibold text-[#04060d]"
        >
          Demander une démo
        </a>
      </div>
    </header>
  );
}
