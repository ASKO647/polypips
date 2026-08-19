import type { Metadata } from "next";
import { StatCard } from "@/components/owner/stat-card";
import { PeriodFilter } from "@/components/owner/period-filter";
import { fetchOwnerPaymentsSummary, fetchRecentOwnerPayments } from "@/lib/stripe/owner-reports";
import { parseOwnerPeriod, ownerPeriodSince } from "@/lib/owner-period";
import { formatOwnerEur, formatOwnerDateTime } from "@/lib/owner-format";
import { OWNER_BASE_PATH } from "@/lib/owner-path";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OwnerPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = parseOwnerPeriod(periodParam);
  const since = ownerPeriodSince(period);
  const basePath = `${OWNER_BASE_PATH}/payments`;

  const [summary, recent] = await Promise.all([
    fetchOwnerPaymentsSummary(since),
    fetchRecentOwnerPayments(25),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Payments</h1>
        <PeriodFilter basePath={basePath} active={period} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Paiements réussis" value={String(summary.succeededCount)} />
        <StatCard label="Échecs" value={String(summary.failedCount)} />
        <StatCard label="Remboursements" value={String(summary.refundedCount)} hint={formatOwnerEur(summary.refundedEur)} />
        <StatCard label="Revenu net" value={formatOwnerEur(summary.netRevenueEur)} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#12151b]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Montant</th>
              <th className="px-4 py-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((p) => (
              <tr key={p.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 text-slate-400">{formatOwnerDateTime(p.createdAt)}</td>
                <td className="px-4 py-3 text-slate-200">{p.customerEmail ?? "—"}</td>
                <td className="px-4 py-3 text-slate-200">{formatOwnerEur(p.amountEur)}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      p.refunded
                        ? "bg-amber-500/10 text-amber-300"
                        : p.status === "succeeded"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-red-500/10 text-red-300"
                    )}
                  >
                    {p.refunded ? "remboursé" : p.status}
                  </span>
                </td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  Aucun paiement récent.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
