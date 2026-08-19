import type { Metadata } from "next";
import { StatCard } from "@/components/owner/stat-card";
import { PeriodFilter } from "@/components/owner/period-filter";
import { OwnerEmptyState } from "@/components/owner/empty-state";
import { fetchOwnerUsersSummary } from "@/lib/supabase/owner-users";
import { fetchOwnerSubscriptionSummary } from "@/lib/supabase/owner-subscriptions";
import { parseOwnerPeriod, ownerPeriodSince } from "@/lib/owner-period";
import { formatOwnerEur, formatOwnerPercent } from "@/lib/owner-format";
import { OWNER_BASE_PATH } from "@/lib/owner-path";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OwnerOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = parseOwnerPeriod(periodParam);
  const since = ownerPeriodSince(period);

  const [users, subs] = await Promise.all([
    fetchOwnerUsersSummary(since ?? undefined),
    fetchOwnerSubscriptionSummary(since),
  ]);

  const payingUsers = subs.proActive + subs.discovertActiveTrials;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Overview</h1>
        <PeriodFilter basePath={OWNER_BASE_PATH} active={period} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total Users" value={String(users.totalUsers)} hint={`+${users.newUsers} sur la période`} />
        <StatCard label="Paying Users" value={String(payingUsers)} />
        <StatCard label="Offres découverte actives" value={String(subs.discovertActiveTrials)} />
        <StatCard label="MRR" value={formatOwnerEur(subs.mrrEur)} hint={`Projeté (avec essais) : ${formatOwnerEur(subs.mrrProjectedEur)}`} />
        <StatCard label="Revenue (Pro actifs)" value={formatOwnerEur(subs.mrrEur)} hint="Voir Revenue pour les montants réellement encaissés (Stripe)" />
        <StatCard
          label="Taux de conversion"
          value={formatOwnerPercent(subs.conversionRatePercent)}
          hint={`${subs.conversionsInPeriod} / ${subs.trialsStartedInPeriod} essais`}
        />
        <StatCard label="Churn" value={formatOwnerPercent(subs.churnRatePercent)} hint={`${subs.canceledInPeriod} annulation(s) sur la période`} />
      </div>

      <OwnerEmptyState
        title="Visiteurs en temps réel — non disponible"
        reason="Aucun outil d'analytics de trafic (Google Analytics, Plausible, PostHog, Vercel Analytics...) n'est installé sur ce projet. Ce chiffre ne peut pas être affiché honnêtement tant qu'un outil de tracking n'est pas ajouté."
      />
    </div>
  );
}
