import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CompetitionBrowser } from "@/components/dashboard/sports/competition-browser";
import { NotifySportButton } from "@/components/dashboard/sports/notify-sport-button";
import { getSportCategory, SPORT_ICONS } from "@/lib/sports/nav";
import { listCompetitions, listCountries } from "@/lib/sports/service";
import type { SportKey } from "@/lib/sports/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string }>;
}): Promise<Metadata> {
  const { sport } = await params;
  const category = getSportCategory(sport);
  return { title: category ? `${category.label} — Sports — Polypips` : "Sports — Polypips" };
}

export default async function SportCategoryPage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;
  const category = getSportCategory(sport);
  if (!category) notFound();

  if (!category.active) {
    const Icon = SPORT_ICONS[category.key];
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/sports/matches"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Retour
          </Link>
          <span className="text-xs text-white/30">Sports &gt; {category.label}</span>
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {category.label}
        </h1>

        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05]">
            <Icon className="h-6 w-6 text-white/30" strokeWidth={2} />
          </span>
          <div className="flex flex-col gap-1.5">
            <p className="font-display text-lg font-bold text-white">
              L&apos;analyse {category.label} arrive bientôt sur Polypips
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-white/50">
              Nous travaillons à couvrir {category.label} avec la même profondeur d&apos;analyse
              que le football. Aucune donnée n&apos;est encore disponible pour ce sport.
            </p>
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
            <NotifySportButton sport={category.key} />
            <Link
              href="/dashboard/sports/football"
              className="text-xs font-semibold text-brand-400 transition-colors hover:text-brand-300"
            >
              Voir le football en attendant →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [competitions, countries] = await Promise.all([
    listCompetitions(category.key as SportKey),
    listCountries(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {category.label}
      </h1>
      <CompetitionBrowser sport={category.key} competitions={competitions} countries={countries} />
    </div>
  );
}
