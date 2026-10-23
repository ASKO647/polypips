import type { Metadata } from "next";
import { StatCard } from "@/components/owner/stat-card";
import { PeriodFilter } from "@/components/owner/period-filter";
import { fetchOwnerSubscriptionSummary } from "@/lib/supabase/owner-subscriptions";
import { fetchOwnerPaymentsSummary } from "@/lib/stripe/owner-reports";
import { fetchOwnerWhopSummary } from "@/lib/supabase/owner-whop-reports";
import { getActivePaymentProvider } from "@/lib/payments/config";
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
  const provider = getActivePaymentProvider();

  // MRR/ARR/ARPU/LTV read public.subscriptions directly, which now holds
  // both Stripe and Whop rows side by side (see the provider column) —
  // provider-agnostic already, no change needed here.
  const subs = await fetchOwnerSubscriptionSummary(since);

  let grossRevenueEur: number;
  let refundedEur: number | null;
  let netRevenueEur: number | null;
  if (provider === "whop") {
    const whop = await fetchOwnerWhopSummary(since);
    grossRevenueEur = whop.grossRevenueEur;
    refundedEur = null;
    netRevenueEur = null;
  } else {
    const payments = await fetchOwnerPaymentsSummary(since);
    grossRevenueEur = payments.grossRevenueEur;
    refundedEur = payments.refundedEur;
    netRevenueEur = payments.netRevenueEur;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Revenue</h1>
        <PeriodFilter basePath={basePath} active={period} />
      </div>

      <p className="max-w-2xl text-sm text-slate-400">
        {provider === "whop"
          ? "Le revenu brut ci-dessous vient du registre local whop_webhook_events (chaque webhook Whop reçu), pas d'un appel direct à l'API Whop — voir le rapport de livraison."
          : "Les montants ci-dessous viennent directement de l'API Stripe (charges + remboursements réels sur la période) — pas d'un montant re-calculé depuis la base Supabase, qui ne stocke jamais le montant réellement encaissé."}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label={provider === "whop" ? "Revenu brut (Whop)" : "Revenu brut (Stripe)"}
          value={formatOwnerEur(grossRevenueEur)}
        />
        {refundedEur !== null && <StatCard label="Remboursements" value={formatOwnerEur(refundedEur)} />}
        {netRevenueEur !== null && <StatCard label="Revenu net" value={formatOwnerEur(netRevenueEur)} />}
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
