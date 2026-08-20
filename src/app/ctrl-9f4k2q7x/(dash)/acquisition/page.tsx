import type { Metadata } from "next";
import { StatCard } from "@/components/owner/stat-card";
import { PeriodFilter } from "@/components/owner/period-filter";
import { OwnerEmptyState } from "@/components/owner/empty-state";
import { fetchOwnerAcquisitionSummary } from "@/lib/supabase/owner-acquisition";
import { parseOwnerPeriod, ownerPeriodSince } from "@/lib/owner-period";
import { formatOwnerPercent } from "@/lib/owner-format";
import { OWNER_BASE_PATH } from "@/lib/owner-path";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OwnerAcquisitionPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = parseOwnerPeriod(periodParam);
  const since = ownerPeriodSince(period);
  const basePath = `${OWNER_BASE_PATH}/acquisition`;

  const summary = await fetchOwnerAcquisitionSummary(since);
  const overallConversionRate =
    summary.totalSignups > 0 ? (summary.totalConverted / summary.totalSignups) * 100 : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Acquisition</h1>
        <PeriodFilter basePath={basePath} active={period} />
      </div>

      <p className="max-w-2xl text-sm text-slate-400">
        Source capturée au premier atterrissage du visiteur (paramètres UTM, ou
        &quot;direct&quot;/&quot;organic&quot; par défaut) et enregistrée une seule fois à
        l&apos;inscription — voir signup_sources. &quot;Converti&quot; signifie que le compte a
        aujourd&apos;hui un abonnement actif ou en essai, pas seulement qu&apos;il s&apos;est
        inscrit.
      </p>

      {summary.totalSignups === 0 ? (
        <OwnerEmptyState
          title="Aucune inscription trackée sur cette période"
          reason="Le tracking UTM vient d'être mis en place — cette page se remplira à partir des prochaines inscriptions réelles. Élargis la période ou reviens plus tard si le déploiement est récent."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Inscriptions" value={String(summary.totalSignups)} />
            <StatCard label="Devenus payants" value={String(summary.totalConverted)} />
            <StatCard
              label="Taux de conversion"
              value={formatOwnerPercent(overallConversionRate)}
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#12151b]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Medium</th>
                  <th className="px-4 py-3 font-medium">Inscriptions</th>
                  <th className="px-4 py-3 font-medium">Devenus payants</th>
                  <th className="px-4 py-3 font-medium">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {summary.bySource.map((row) => (
                  <tr key={row.source} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-200">{row.source}</td>
                    <td className="px-4 py-3 text-slate-400">{row.medium ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-200">{row.signups}</td>
                    <td className="px-4 py-3 text-slate-200">{row.converted}</td>
                    <td className="px-4 py-3 text-slate-200">
                      {formatOwnerPercent(row.conversionRatePercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
