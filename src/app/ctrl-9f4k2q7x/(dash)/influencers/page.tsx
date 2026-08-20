import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { StatCard } from "@/components/owner/stat-card";
import { OwnerEmptyState } from "@/components/owner/empty-state";
import {
  fetchOwnerInfluencers,
  fetchOwnerInfluencerOverview,
} from "@/lib/supabase/owner-influencers";
import { formatOwnerEur, formatOwnerPercent } from "@/lib/owner-format";
import { OWNER_BASE_PATH } from "@/lib/owner-path";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OwnerInfluencersPage() {
  const [influencers, overview] = await Promise.all([
    fetchOwnerInfluencers(),
    fetchOwnerInfluencerOverview(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Influenceurs</h1>
        <Link
          href={`${OWNER_BASE_PATH}/influencers/new`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#0b0d10] hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" /> Ajouter un influenceur
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Inscriptions ramenées" value={String(overview.totalReferrals)} />
        <StatCard label="Conversions payantes" value={String(overview.totalConverted)} />
        <StatCard
          label="Meilleur influenceur"
          value={overview.bestInfluencer?.name ?? "—"}
          hint={
            overview.bestInfluencer
              ? `${overview.bestInfluencer.convertedCount} conversion${overview.bestInfluencer.convertedCount > 1 ? "s" : ""}`
              : undefined
          }
        />
        <StatCard
          label="Commission due ce mois-ci"
          value={formatOwnerEur(overview.commissionDueThisMonthEur)}
        />
      </div>

      {influencers.length === 0 ? (
        <OwnerEmptyState
          title="Aucun influenceur enregistré"
          reason="Ajoute un premier influenceur pour générer son code promo et/ou son lien traçant — cette page se remplira avec ses vraies statistiques dès ses premières inscriptions ramenées."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#12151b]">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Code / lien</th>
                <th className="px-4 py-3 font-medium">Inscriptions</th>
                <th className="px-4 py-3 font-medium">Conversions</th>
                <th className="px-4 py-3 font-medium">Taux</th>
                <th className="px-4 py-3 font-medium">Commission due</th>
                <th className="px-4 py-3 font-medium">Commission payée</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {influencers.map((inf) => (
                <tr key={inf.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`${OWNER_BASE_PATH}/influencers/${inf.id}`}
                      className="font-medium text-cyan-300 hover:text-cyan-200"
                    >
                      {inf.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    <div className="flex flex-col gap-0.5">
                      {inf.codePromo && <span>Code : {inf.codePromo}</span>}
                      {inf.trackingSlug && <span>/i/{inf.trackingSlug}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{inf.referralsCount}</td>
                  <td className="px-4 py-3 text-slate-200">{inf.convertedCount}</td>
                  <td className="px-4 py-3 text-slate-200">
                    {formatOwnerPercent(inf.conversionRatePercent)}
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    {formatOwnerEur(inf.commissionPendingEur)}
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    {formatOwnerEur(inf.commissionPaidEur)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        inf.status === "active"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-white/10 text-slate-400"
                      )}
                    >
                      {inf.status === "active" ? "Actif" : "En pause"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
