import type { Metadata } from "next";
import { StatCard } from "@/components/owner/stat-card";
import { PeriodFilter } from "@/components/owner/period-filter";
import { OwnerEmptyState } from "@/components/owner/empty-state";
import { VercelPageviewsChart } from "@/components/owner/vercel-pageviews-chart";
import {
  fetchVisitsTotals,
  fetchDailyVisits,
  isVercelAnalyticsConfigured,
  VercelAnalyticsUnavailableError,
} from "@/lib/vercel/analytics";
import { parseOwnerPeriod, ownerPeriodSince } from "@/lib/owner-period";
import { OWNER_BASE_PATH } from "@/lib/owner-path";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** "all" has no meaning against an external API with its own (unknown,
 * plan-dependent) retention window — fall back to a bounded 90-day range
 * rather than querying an unbounded period. */
const FALLBACK_DAYS_FOR_ALL = 90;

function fallbackSince(): Date {
  return new Date(Date.now() - FALLBACK_DAYS_FOR_ALL * 24 * 60 * 60 * 1000);
}

export default async function OwnerAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = parseOwnerPeriod(periodParam);
  const since = ownerPeriodSince(period) ?? fallbackSince();
  const until = new Date();
  const basePath = `${OWNER_BASE_PATH}/analytics`;

  if (!isVercelAnalyticsConfigured()) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-display text-xl font-semibold text-white">Analytics</h1>
        <OwnerEmptyState
          title="Vercel Web Analytics n'est pas encore configuré"
          reason="Il manque VERCEL_API_TOKEN, VERCEL_PROJECT_ID et/ou VERCEL_TEAM_ID dans les variables d'environnement de ce déploiement. Une fois ajoutées et redéployé, cette page affichera les vraies données."
        />
      </div>
    );
  }

  // Fetched inside try/catch, rendered outside it — JSX construction can't
  // live inside a try/catch (an eslint rule enforces this: React doesn't
  // render synchronously, so errors thrown while building the tree
  // wouldn't actually be caught here).
  let data: { totals: Awaited<ReturnType<typeof fetchVisitsTotals>>; daily: Awaited<ReturnType<typeof fetchDailyVisits>> } | null = null;
  let errorMessage: string | null = null;
  try {
    const [totals, daily] = await Promise.all([
      fetchVisitsTotals(since, until),
      fetchDailyVisits(since, until),
    ]);
    data = { totals, daily };
  } catch (error) {
    errorMessage =
      error instanceof VercelAnalyticsUnavailableError
        ? error.message
        : "Erreur inattendue lors de l'appel à l'API Vercel Web Analytics.";
    console.error("[owner-analytics] fetch failed", error);
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-display text-xl font-semibold text-white">Analytics</h1>
        <OwnerEmptyState
          title="Impossible de récupérer les données Vercel Analytics"
          reason={errorMessage!}
        />
      </div>
    );
  }

  const { totals, daily } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Analytics</h1>
        <PeriodFilter basePath={basePath} active={period} />
      </div>

      <p className="max-w-2xl text-sm text-slate-400">
        Données Vercel Web Analytics réelles pour ce projet. Vercel ne distingue pas de métrique
        &quot;sessions&quot; à part — &quot;visiteurs&quot; (visiteurs uniques) en est l&apos;équivalent le plus
        proche.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Pages vues" value={totals.pageviews.toLocaleString("fr-FR")} />
        <StatCard label="Visiteurs uniques" value={totals.visitors.toLocaleString("fr-FR")} />
        <StatCard
          label="Pages vues / visiteur"
          value={totals.visitors > 0 ? (totals.pageviews / totals.visitors).toFixed(1) : "—"}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-display text-base font-semibold text-white">Pages vues par jour</h2>
        <VercelPageviewsChart data={daily} />
      </div>
    </div>
  );
}
