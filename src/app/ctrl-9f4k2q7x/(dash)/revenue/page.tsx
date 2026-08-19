import type { Metadata } from "next";
import { StatCard } from "@/components/owner/stat-card";
import { PeriodFilter } from "@/components/owner/period-filter";
import { fetchOwnerSubscriptionSummary } from "@/lib/supabase/owner-subscriptions";
import { fetchOwnerPaymentsSummary } from "@/lib/stripe/owner-reports";
import { parseOwnerPeriod, ownerPeriodSince } from "@/lib/owner-period";
import { formatOwnerEur } from "@/lib/owner-format";
import { OWNER_BASE_PATH } from "@/lib/owner-path";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OwnerRevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = parseOwnerPeriod(periodParam);
  const since = ownerPeriodSince(period);
  const basePath = `${OWNER_BASE_PATH}/revenue`;

  const [subs, payments] = await Promise.all([
    fetchOwnerSubscriptionSummary(since),
    fetchOwnerPaymentsSummary(since),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Revenue</h1>
        <PeriodFilter basePath={basePath} active={period} />
      </div>

      <p className="max-w-2xl text-sm text-slate-400">
        Les montants ci-dessous viennent directement de l&apos;API Stripe (charges +
        remboursements réels sur la période) — pas d&apos;un montant re-calculé depuis
        la base Supabase, qui ne stocke jamais le montant réellement encaissé.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Revenu brut (Stripe)" value={formatOwnerEur(payments.grossRevenueEur)} />
        <StatCard label="Remboursements" value={formatOwnerEur(payments.refundedEur)} />
        <StatCard label="Revenu net" value={formatOwnerEur(payments.netRevenueEur)} />
        <StatCard label="MRR (abonnés actifs)" value={formatOwnerEur(subs.mrrEur)} />
        <StatCard label="MRR projeté (avec essais)" value={formatOwnerEur(subs.mrrProjectedEur)} />
        <StatCard label="ARR estimé" value={formatOwnerEur(subs.arrEur)} />
        <StatCard label="ARPU" value={formatOwnerEur(subs.arpuEur)} />
        <StatCard
          label="LTV estimée"
          value={subs.ltvEur !== null ? formatOwnerEur(subs.ltvEur) : "—"}
          hint={subs.ltvEur === null ? "Pas encore assez de données de churn" : "ARPU / taux de churn — indicatif"}
        />
      </div>
    </div>
  );
}
