"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Gift } from "lucide-react";
import { getOrCreateReferralSlug } from "@/app/[locale]/dashboard/settings/referral-actions";
import {
  REFERRAL_COMMISSION_EUR,
  REFERRAL_STATUS_LABELS,
  type ReferralHistoryItem,
  type ReferralStats,
} from "@/lib/data/referrals";
import { cn } from "@/lib/utils";

const EUR = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

/** Local to the user dashboard on purpose — components/owner/copy-link-button.tsx
 * is styled for the owner console's slate palette and must not leak into the
 * white/brand-red dashboard UI. */
function ReferralCopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("[referral-tab] clipboard write failed", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/15"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-400" /> Copié !
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" /> Copier
        </>
      )}
    </button>
  );
}

function ReferralStatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-1.5 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function statusTone(status: ReferralHistoryItem["status"]): string {
  if (status === "commission_payee") return "bg-emerald-500/15 text-emerald-300";
  if (status === "commission_en_attente") return "bg-amber-500/15 text-amber-300";
  return "bg-white/10 text-white/60";
}

export function ReferralTab({
  origin,
  initialSlug,
  stats,
  history,
}: {
  origin: string;
  initialSlug: string | null;
  stats: ReferralStats;
  history: ReferralHistoryItem[];
}) {
  const [slug, setSlug] = useState(initialSlug);

  useEffect(() => {
    if (slug) return;
    let cancelled = false;
    getOrCreateReferralSlug().then((created) => {
      if (!cancelled) setSlug(created);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const link = slug ? `${origin}/r/${slug}` : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-2.5 rounded-xl border border-brand-400/20 bg-brand-500/[0.06] px-4 py-3">
        <Gift className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" strokeWidth={2} />
        <p className="text-xs leading-relaxed text-white/70">
          Parrainez un ami, gagnez {EUR.format(REFERRAL_COMMISSION_EUR)} dès qu&apos;il devient
          abonné Pro. La commission est ajoutée à vos gains en attente une fois son abonnement
          confirmé, puis versée manuellement par notre équipe.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white">Votre lien de parrainage</label>
        <div className="mt-2 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <input
            type="text"
            value={link ?? "Génération de votre lien..."}
            disabled
            readOnly
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white/70 sm:max-w-md"
          />
          {link && <ReferralCopyButton value={link} />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ReferralStatTile label="Personnes parrainées" value={String(stats.totalReferred)} />
        <ReferralStatTile label="Devenues payantes" value={String(stats.totalConverted)} />
        <ReferralStatTile label="Gains en attente" value={EUR.format(stats.pendingEur)} />
        <ReferralStatTile label="Gains versés" value={EUR.format(stats.paidEur)} />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-white">Historique des filleuls</h3>
        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-8 text-center text-sm text-white/40">
            Personne n&apos;a encore utilisé votre lien.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                  <th className="px-4 py-3 font-medium">Inscrit</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Commission</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-white/60">{item.referredAgo}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          statusTone(item.status)
                        )}
                      >
                        {REFERRAL_STATUS_LABELS[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/80">
                      {item.commissionAmount !== null ? EUR.format(item.commissionAmount) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
