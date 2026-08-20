import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Clock } from "lucide-react";
import { CompetitionBrowser } from "@/components/dashboard/sports/competition-browser";
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
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05]">
          <Icon className="h-6 w-6 text-white/30" strokeWidth={2} />
        </span>
        <div className="flex flex-col gap-1.5">
          <p className="font-display text-lg font-bold text-white">
            {category.label} — bientôt disponible
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-white/50">
            Ce sport n&apos;est pas encore couvert par l&apos;analyse Polypips. Le football est
            disponible dès aujourd&apos;hui.
          </p>
        </div>
        <Link
          href="/dashboard/sports/football"
          className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300"
        >
          <Clock className="h-3.5 w-3.5" strokeWidth={2} />
          Voir le football en attendant
        </Link>
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
