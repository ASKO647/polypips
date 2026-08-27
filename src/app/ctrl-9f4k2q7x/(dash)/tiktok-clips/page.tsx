import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { StatCard } from "@/components/owner/stat-card";
import { MarkCommissionPaidButton } from "@/components/owner/mark-commission-paid-button";
import { TiktokReviewRow } from "@/components/owner/tiktok-review-row";
import { OwnerEmptyState } from "@/components/owner/empty-state";
import { fetchOwnerTiktokSubmissions } from "@/lib/supabase/owner-tiktok-clips";
import { approveTiktokSubmission, rejectTiktokSubmission, markTiktokSubmissionPaid } from "./actions";
import { formatOwnerEur, formatOwnerDateTime } from "@/lib/owner-format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  verified: "Vérifiée",
  rejected: "Refusée",
  paid: "Payée",
};

function statusTone(status: string): string {
  if (status === "paid") return "bg-emerald-500/15 text-emerald-300";
  if (status === "verified") return "bg-sky-500/15 text-sky-300";
  if (status === "rejected") return "bg-rose-500/15 text-rose-300";
  return "bg-amber-500/15 text-amber-300";
}

export default async function OwnerTiktokClipsPage() {
  const submissions = await fetchOwnerTiktokSubmissions();

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const verifiedDueEur = submissions
    .filter((s) => s.status === "verified")
    .reduce((sum, s) => sum + (s.paymentAmountEur ?? 0), 0);
  const paidEur = submissions
    .filter((s) => s.status === "paid")
    .reduce((sum, s) => sum + (s.paymentAmountEur ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-white">Clips TikTok</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Soumissions totales" value={String(submissions.length)} />
        <StatCard label="À vérifier" value={String(pendingCount)} />
        <StatCard label="Rémunération due" value={formatOwnerEur(verifiedDueEur)} />
        <StatCard label="Total payé" value={formatOwnerEur(paidEur)} />
      </div>

      {submissions.length === 0 ? (
        <OwnerEmptyState
          title="Aucune soumission pour l'instant"
          reason="Dès qu'un utilisateur soumet une vidéo depuis Paramètres → Monétiser mon TikTok, elle apparaîtra ici pour vérification."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#12151b]">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Utilisateur</th>
                <th className="px-4 py-3 font-medium">Vidéo</th>
                <th className="px-4 py-3 font-medium">Soumise le</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Rémunération</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => {
                const boundMarkPaid = markTiktokSubmissionPaid.bind(null, s.id);
                return (
                  <tr key={s.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-slate-200">{s.userEmail ?? "—"}</td>
                    <td className="px-4 py-3">
                      <a
                        href={s.tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-slate-300 hover:text-white hover:underline"
                      >
                        Voir la vidéo <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatOwnerDateTime(s.submittedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "w-fit rounded-full px-2.5 py-1 text-xs font-semibold",
                            statusTone(s.status)
                          )}
                        >
                          {STATUS_LABELS[s.status]}
                          {s.status !== "pending" && s.verifiedViews !== null
                            ? ` · ${s.verifiedViews.toLocaleString("fr-FR")} vues`
                            : ""}
                        </span>
                        {s.status === "rejected" && s.rejectionReason && (
                          <span className="text-xs text-slate-500">{s.rejectionReason}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {s.paymentAmountEur !== null ? formatOwnerEur(s.paymentAmountEur) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {s.status === "pending" && (
                        <TiktokReviewRow
                          submissionId={s.id}
                          onApprove={approveTiktokSubmission}
                          onReject={rejectTiktokSubmission}
                        />
                      )}
                      {s.status === "verified" && <MarkCommissionPaidButton action={boundMarkPaid} />}
                      {(s.status === "paid" || s.status === "rejected") && (
                        <span className="text-slate-500">—</span>
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
