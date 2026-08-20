import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCountryFlag, listCompetitions } from "@/lib/sports/service";

export const metadata: Metadata = {
  title: "Compétitions — Sports — Polypips",
};

export default async function SportsCompetitionsPage() {
  const competitions = await listCompetitions();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Compétitions
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Toutes les compétitions couvertes par l&apos;analyse Polypips.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        {competitions.map((comp) => (
          <Link
            key={comp.id}
            href={`/dashboard/sports/${comp.sport}/${comp.id}`}
            className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-white/[0.04]"
          >
            <div>
              <p className="text-sm font-semibold text-white">{comp.name}</p>
              <p className="flex items-center gap-1.5 text-xs text-white/40">
                <span aria-hidden>{getCountryFlag(comp.country)}</span>
                {comp.country}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/30" strokeWidth={2} />
          </Link>
        ))}
      </div>
    </div>
  );
}
