import type { Metadata } from "next";
import { StatCard } from "@/components/owner/stat-card";
import { MarkCommissionPaidButton } from "@/components/owner/mark-commission-paid-button";
import { OwnerEmptyState } from "@/components/owner/empty-state";
import { fetchOwnerReferrals } from "@/lib/supabase/owner-referrals";
import { markReferralCommissionPaid } from "./actions";
import { formatOwnerEur, formatOwnerDateTime } from "@/lib/owner-format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OwnerReferralsPage() {
  const referrals = await fetchOwnerReferrals();

  const converted = referrals.filter((r) => r.convertedToPaid);
  const pendingEur = referrals
    .filter((r) => r.commissionStatus === "pending")
    .reduce((sum, r) => sum + (r.commissionAmountEur ?? 0), 0);
  const paidEur = referrals
    .filter((r) => r.commissionStatus === "paid")
    .reduce((sum, r) => sum + (r.commissionAmountEur ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-white">Parrainage</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Parrainages" value={String(referrals.length)} />
        <StatCard label="Devenus payants" value={String(converted.length)} />
        <StatCard label="Commission due" value={formatOwnerEur(pendingEur)} />
        <StatCard label="Commission payée" value={formatOwnerEur(paidEur)} />
      </div>

      {referrals.length === 0 ? (
        <OwnerEmptyState
          title="Aucun parrainage pour l'instant"
          reason="Dès qu'un utilisateur partage son lien depuis Paramètres → Inviter et gagner et qu'une personne s'inscrit via ce lien, elle apparaîtra ici."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#12151b]">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Parrain</th>
                <th className="px-4 py-3 font-medium">Filleul</th>
                <th className="px-4 py-3 font-medium">Inscrit le</th>
                <th className="px-4 py-3 font-medium">Converti</th>
                <th className="px-4 py-3 font-medium">Commission</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => {
                const boundMarkPaid = markReferralCommissionPaid.bind(null, r.id);
                return (
                  <tr key={r.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-slate-200">{r.referrerEmail ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-200">{r.referredEmail ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-400">{formatOwnerDateTime(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          r.convertedToPaid
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-white/10 text-slate-400"
                        )}
                      >
                        {r.convertedToPaid ? "Oui" : "Pas encore"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {r.commissionAmountEur !== null ? formatOwnerEur(r.commissionAmountEur) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {!r.convertedToPaid ? (
                        <span className="text-slate-500">—</span>
                      ) : r.commissionStatus === "paid" ? (
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                          Payée
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300">
                            En attente
                          </span>
                          <MarkCommissionPaidButton action={boundMarkPaid} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
