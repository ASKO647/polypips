import type { Metadata } from "next";
import { StatCard } from "@/components/owner/stat-card";
import { PeriodFilter } from "@/components/owner/period-filter";
import { fetchOwnerProductUsage } from "@/lib/supabase/owner-usage";
import { parseOwnerPeriod, ownerPeriodSince } from "@/lib/owner-period";
import { OWNER_BASE_PATH } from "@/lib/owner-path";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OwnerProductUsagePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = parseOwnerPeriod(periodParam);
  const since = ownerPeriodSince(period);
  const basePath = `${OWNER_BASE_PATH}/product-usage`;

  const usage = await fetchOwnerProductUsage(since);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Product Usage</h1>
        <PeriodFilter basePath={basePath} active={period} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Analyses IA" value={String(usage.analyses)} />
        <StatCard label="Marchés sélectionnés (scans)" value={String(usage.selectedMarkets)} />
        <StatCard label="Suivis Smart Money" value={String(usage.smartMoneyFollows)} />
        <StatCard label="Stratégies Copy Trading actives" value={String(usage.copyTradingActiveStrategies)} />
        <StatCard label="Messages Coach IA" value={String(usage.coachMessages)} />
        <StatCard label="Messages Communauté" value={String(usage.communityMessages)} />
      </div>

      <p className="text-xs text-slate-500">
        &quot;Statistiques&quot; n&apos;apparaît pas ici : rien dans le schéma n&apos;enregistre une
        visite de page, seulement les actions qui l&apos;alimentent (déjà comptées
        ci-dessus).
      </p>
    </div>
  );
}
