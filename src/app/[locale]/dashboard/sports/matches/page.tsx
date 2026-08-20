import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { SPORT_CATEGORIES, SPORT_ICONS } from "@/lib/sports/nav";

export const metadata: Metadata = {
  title: "Matches — Sports — Polypips",
};

export default function SportsMatchesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Tous les sports
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Choisissez un sport pour découvrir les matchs et obtenir l&apos;analyse Polypips.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {SPORT_CATEGORIES.map((sport) => {
          const Icon = SPORT_ICONS[sport.key];
          return (
            <Link
              key={sport.key}
              href={`/dashboard/sports/${sport.key}`}
              className={`flex flex-col items-center gap-3 rounded-2xl border p-6 text-center transition-colors duration-150 ${
                sport.active
                  ? "border-white/10 bg-white/[0.03] hover:border-brand-400/50"
                  : "border-white/5 bg-white/[0.015] opacity-60 hover:border-white/15 hover:opacity-90"
              }`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="text-sm font-semibold text-white">{sport.label}</span>
              {!sport.active && (
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/40">
                  Bientôt disponible
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
