import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { StatCard } from "@/components/owner/stat-card";
import { CopyLinkButton } from "@/components/owner/copy-link-button";
import { MarkCommissionPaidButton } from "@/components/owner/mark-commission-paid-button";
import { ToggleInfluencerStatusButton } from "@/components/owner/toggle-influencer-status-button";
import { fetchOwnerInfluencerDetail } from "@/lib/supabase/owner-influencers";
import { markCommissionPaid, setInfluencerStatus } from "../actions";
import { formatOwnerEur, formatOwnerPercent, formatOwnerDateTime } from "@/lib/owner-format";
import { requestOrigin } from "@/lib/owner-origin";
import { OWNER_BASE_PATH } from "@/lib/owner-path";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OwnerInfluencerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, origin] = await Promise.all([fetchOwnerInfluencerDetail(id), requestOrigin()]);
  if (!detail) notFound();

  const { influencer, referrals } = detail;
  const converted = referrals.filter((r) => r.convertedToPaid);
  const commissionPendingEur = referrals
    .filter((r) => r.commissionStatus === "pending")
    .reduce((sum, r) => sum + (r.commissionAmountEur ?? 0), 0);
  const commissionPaidEur = referrals
    .filter((r) => r.commissionStatus === "paid")
    .reduce((sum, r) => sum + (r.commissionAmountEur ?? 0), 0);
  const conversionRatePercent =
    referrals.length > 0 ? (converted.length / referrals.length) * 100 : null;

  const link = influencer.trackingSlug ? `${origin}/i/${influencer.trackingSlug}` : null;
  const boundToggleStatus = setInfluencerStatus.bind(
    null,
    id,
    influencer.status === "active" ? "paused" : "active"
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`${OWNER_BASE_PATH}/influencers`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-xl font-semibold text-white">{influencer.name}</h1>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                influencer.status === "active"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-white/10 text-slate-400"
              )}
            >
              {influencer.status === "active" ? "Actif" : "En pause"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ToggleInfluencerStatusButton status={influencer.status} action={boundToggleStatus} />
          <Link
            href={`${OWNER_BASE_PATH}/influencers/${id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            <Pencil className="h-3.5 w-3.5" /> Modifier
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-[#12151b] p-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Code promo</p>
          <p className="text-sm text-white">{influencer.codePromo ?? "—"}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Lien traçant</p>
          {link ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="break-all text-sm text-white">{link}</span>
              <CopyLinkButton value={link} />
            </div>
          ) : (
            <p className="text-sm text-white">—</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Commission</p>
          <p className="text-sm text-white">
            {influencer.commissionType === "percent"
              ? `${influencer.commissionValue} %`
              : formatOwnerEur(influencer.commissionValue)}{" "}
            par conversion
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Contact</p>
          <p className="text-sm text-white">{influencer.contactEmail ?? "—"}</p>
        </div>
        {influencer.notes && (
          <div className="flex flex-col gap-1 sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</p>
            <p className="text-sm text-slate-300">{influencer.notes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Inscriptions ramenées" value={String(referrals.length)} />
        <StatCard label="Conversions payantes" value={String(converted.length)} />
        <StatCard label="Taux de conversion" value={formatOwnerPercent(conversionRatePercent)} />
        <StatCard label="Commission due" value={formatOwnerEur(commissionPendingEur)} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-display text-base font-semibold text-white">
          Utilisateurs ramenés ({referrals.length})
        </h2>
        {referrals.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-[#12151b] px-6 py-10 text-center text-sm text-slate-400">
            Aucune inscription ramenée pour l&apos;instant.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#12151b]">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Utilisateur</th>
                  <th className="px-4 py-3 font-medium">Ramené via</th>
                  <th className="px-4 py-3 font-medium">Inscrit le</th>
                  <th className="px-4 py-3 font-medium">Converti</th>
                  <th className="px-4 py-3 font-medium">Montant payé</th>
                  <th className="px-4 py-3 font-medium">Commission</th>
                  <th className="px-4 py-3 font-medium">Statut commission</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => {
                  const boundMarkPaid = markCommissionPaid.bind(null, r.id, id);
                  return (
                    <tr key={r.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3 text-slate-200">{r.userEmail ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {r.referredVia === "code" ? "Code promo" : "Lien"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {formatOwnerDateTime(r.createdAt)}
                      </td>
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
                        {r.subscriptionAmountEur !== null
                          ? formatOwnerEur(r.subscriptionAmountEur)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-200">
                        {r.commissionAmountEur !== null
                          ? formatOwnerEur(r.commissionAmountEur)
                          : "—"}
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

      <div className="flex flex-col gap-2">
        <h2 className="font-display text-base font-semibold text-white">
          Historique des commissions
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
          <StatCard label="Total payé" value={formatOwnerEur(commissionPaidEur)} />
          <StatCard label="Total en attente" value={formatOwnerEur(commissionPendingEur)} />
        </div>
      </div>
    </div>
  );
}
