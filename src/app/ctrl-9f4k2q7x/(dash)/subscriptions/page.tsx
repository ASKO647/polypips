import type { Metadata } from "next";
import { StatCard } from "@/components/owner/stat-card";
import { PeriodFilter } from "@/components/owner/period-filter";
import { fetchOwnerSubscriptionSummary } from "@/lib/supabase/owner-subscriptions";
import { parseOwnerPeriod, ownerPeriodSince } from "@/lib/owner-period";
import { formatOwnerPercent } from "@/lib/owner-format";
import { OWNER_BASE_PATH } from "@/lib/owner-path";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OwnerSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = parseOwnerPeriod(periodParam);
  const since = ownerPeriodSince(period);
  const basePath = `${OWNER_BASE_PATH}/subscriptions`;

  const subs = await fetchOwnerSubscriptionSummary(since);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Subscriptions</h1>
        <PeriodFilter basePath={basePath} active={period} />
      </div>

      <p className="max-w-2xl text-sm text-slate-400">
        Modèle actuel : Découverte (0,99 € / 3 jours) convertit automatiquement en
        Pro (29,99 € / mois). Le plan &quot;pro-plus&quot; à 79 € est retiré et ne peut plus
        réapparaître (contrainte SQL sur subscriptions.plan).
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Essais Découverte démarrés" value={String(subs.trialsStartedInPeriod)} />
        <StatCard label="Essais Découverte actifs" value={String(subs.discovertActiveTrials)} />
        <StatCard
          label="Conversions Découverte → Pro"
          value={String(subs.conversionsInPeriod)}
          hint={formatOwnerPercent(subs.conversionRatePercent)}
        />
        <StatCard label="Abonnements Pro actifs" value={String(subs.proActive)} />
        <StatCard label="Annulés sur la période" value={String(subs.canceledInPeriod)} />
        <StatCard label="Impayés (past_due)" value={String(subs.pastDue)} />
        <StatCard label="Churn" value={formatOwnerPercent(subs.churnRatePercent)} />
      </div>

      <p className="text-xs text-slate-500">
        Taux de conversion et churn sont calculés à partir des lignes réellement
        écrites par le webhook Stripe (conversion trackée via
        subscriptions.converted_from_trial / converted_at, ajoutés spécifiquement
        pour cette métrique) — ce ne sont pas des estimations arbitraires, mais la
        méthode de calcul (proxy sur la période plutôt qu&apos;un cohort réel
        jour par jour) reste indicative.
      </p>
    </div>
  );
}
