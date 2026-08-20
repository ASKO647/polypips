import type { Metadata } from "next";
import { StatCard } from "@/components/owner/stat-card";
import { OwnerEmptyState } from "@/components/owner/empty-state";
import { AutoRefresh } from "@/components/owner/auto-refresh";
import {
  fetchRecentVisitors,
  isVercelAnalyticsConfigured,
  RECENT_WINDOW_MINUTES,
  VercelAnalyticsUnavailableError,
} from "@/lib/vercel/analytics";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OwnerRealtimePage() {
  if (!isVercelAnalyticsConfigured()) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-display text-xl font-semibold text-white">Real-Time</h1>
        <OwnerEmptyState
          title="Vercel Web Analytics n'est pas encore configuré"
          reason="Il manque VERCEL_API_TOKEN, VERCEL_PROJECT_ID et/ou VERCEL_TEAM_ID dans les variables d'environnement de ce déploiement. Une fois ajoutées et redéployé, cette page affichera les vraies données."
        />
      </div>
    );
  }

  // Fetched inside try/catch, rendered outside it — see the Analytics
  // page for why (react-hooks/error-boundaries forbids JSX in try/catch).
  let recent: Awaited<ReturnType<typeof fetchRecentVisitors>> | null = null;
  let errorMessage: string | null = null;
  try {
    recent = await fetchRecentVisitors();
  } catch (error) {
    errorMessage =
      error instanceof VercelAnalyticsUnavailableError
        ? error.message
        : "Erreur inattendue lors de l'appel à l'API Vercel Web Analytics.";
    console.error("[owner-realtime] fetch failed", error);
  }

  if (!recent) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-display text-xl font-semibold text-white">Real-Time</h1>
        <OwnerEmptyState
          title="Impossible de récupérer les données Vercel Analytics"
          reason={errorMessage!}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Real-Time</h1>
        <AutoRefresh intervalSeconds={60} />
      </div>

      <p className="max-w-2xl text-sm text-slate-400">
        Ce n&apos;est pas un flux live : l&apos;API Vercel Web Analytics elle-même peut mettre
        jusqu&apos;à une trentaine de minutes à faire apparaître une visite tout juste survenue, et
        cette page se recalcule seulement toutes les 60 secondes. &quot;Visiteurs actifs&quot; ci-dessous
        compte les visiteurs uniques sur les {RECENT_WINDOW_MINUTES} dernières minutes, pas
        l&apos;instant présent.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label={`Visiteurs actifs (${RECENT_WINDOW_MINUTES} min)`}
          value={recent.visitors.toLocaleString("fr-FR")}
        />
        <StatCard
          label={`Pages vues (${RECENT_WINDOW_MINUTES} min)`}
          value={recent.pageviews.toLocaleString("fr-FR")}
        />
      </div>
    </div>
  );
}
