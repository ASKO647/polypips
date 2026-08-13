"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { NotificationsBell } from "@/components/dashboard/notifications-bell";
import type { NotificationItem } from "@/lib/data/notifications";

export function DashboardHeader({
  menuOpen,
  onMenuToggle,
  notifications,
}: {
  menuOpen: boolean;
  onMenuToggle: () => void;
  notifications: NotificationItem[];
}) {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-white/10 bg-[#160b0c]/95 px-5 backdrop-blur-md lg:px-8">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 lg:hidden"
        aria-label="Polypips — tableau de bord"
      >
        <Image
          src="/polypips-mark.png"
          alt=""
          width={290}
          height={322}
          className="h-6 w-auto"
        />
      </Link>

      <span className="hidden lg:block" />

      <div className="flex items-center gap-2.5 sm:gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/70">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          Offre découverte
        </span>

        <NotificationsBell notifications={notifications} />

        <button
          type="button"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          onClick={onMenuToggle}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-transform duration-150 ease-out hover:scale-105 hover:text-white active:scale-95 lg:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
