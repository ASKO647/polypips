"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { OWNER_NAV_ITEMS } from "@/components/owner/owner-nav-data";
import { OWNER_BASE_PATH } from "@/lib/owner-path";

/** Deliberately styled nothing like DashboardShell (the user-facing
 * dashboard's red/brand palette) — graphite + a single cold accent, so
 * there's no visual chance of confusing this for a page a normal user
 * could reach. */
export function OwnerShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#0b0d10] text-slate-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#0e1116] lg:flex">
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
          <ShieldAlert className="h-5 w-5 text-cyan-400" strokeWidth={2} />
          <span className="font-display text-sm font-semibold tracking-wide text-white">
            Polypips — Console
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-0.5">
            {OWNER_NAV_ITEMS.map((item) => {
              const active =
                item.href === OWNER_BASE_PATH
                  ? pathname === OWNER_BASE_PATH
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-cyan-500/10 text-cyan-300"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    )}
                  >
                    <item.icon className="h-4 w-4" strokeWidth={2} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-white/10 px-4 py-4 text-xs text-slate-500">
          Accès restreint — usage interne uniquement.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-[#0e1116] px-5 py-3.5">
          <span className="lg:hidden font-display text-sm font-semibold text-white">
            Console
          </span>
          <span className="hidden text-sm text-slate-400 lg:inline">{email}</span>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
            Quitter la console
          </Link>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-white/10 bg-[#0e1116] px-3 py-2 lg:hidden">
          {OWNER_NAV_ITEMS.map((item) => {
            const active =
              item.href === OWNER_BASE_PATH
                ? pathname === OWNER_BASE_PATH
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-cyan-500/10 text-cyan-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
