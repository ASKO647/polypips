import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { SPORT_CATEGORIES, SPORT_EMOJIS } from "@/lib/sports/nav";

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
        {SPORT_CATEGORIES.map((sport) => (
          <Link
            key={sport.key}
            href={`/dashboard/sports/${sport.key}`}
            className={`relative flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center transition-colors duration-150 hover:border-brand-400/50 ${
              sport.active ? "" : "opacity-60"
            }`}
          >
            {!sport.active && (
              <span className="absolute right-3 top-3 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
                Bientôt
              </span>
            )}
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-2xl">
              {SPORT_EMOJIS[sport.key]}
            </span>
            <span className="text-sm font-semibold text-white">{sport.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
