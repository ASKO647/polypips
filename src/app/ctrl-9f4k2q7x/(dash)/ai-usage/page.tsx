import type { Metadata } from "next";
import { StatCard } from "@/components/owner/stat-card";
import { WalletChart } from "@/components/ui/wallet-chart";
import { fetchOwnerAiUsage } from "@/lib/supabase/owner-usage";
import { fetchOwnerAiCosts } from "@/lib/supabase/owner-ai-costs";

export const metadata: Metadata = { robots: { index: false, follow: false } };

function usd(value: number): string {
  return `$${value.toFixed(2)}`;
}

export default async function OwnerAiUsagePage() {
  const usage = await fetchOwnerAiUsage();
  const costs = await fetchOwnerAiCosts();
  const hasEvolution = usage.evolution30d.some((v) => v > 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-white">AI Usage</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Analyses — total" value={String(usage.analysesTotal)} />
        <StatCard label="Analyses — aujourd'hui" value={String(usage.analysesToday)} />
        <StatCard label="Marchés analysés (scan IA)" value={String(usage.marketsAnalyzed)} />
        <StatCard label="Utilisateurs actifs IA (90j)" value={String(usage.activeAiUsers)} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#12151b] p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Évolution des analyses — 30 derniers jours
        </p>
        <div className="mt-4 h-32">
          {hasEvolution ? (
            <WalletChart points={usage.evolution30d} positive tone="brand" />
          ) : (
            <p className="text-sm text-slate-500">Aucune analyse sur cette période.</p>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold text-white">Coûts IA</h2>

        {!costs.hasData ? (
          <p className="text-sm text-slate-500">
            Aucune donnée de coût IA pour le moment — soit la migration
            ai_usage_events n&apos;a pas encore été appliquée, soit aucun appel
            Anthropic n&apos;a encore été enregistré ce mois-ci.
          </p>
        ) : (
          <>
            {costs.hardCapExceeded && (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
                ⚠ Plafond mensuel global dépassé : {usd(costs.totalCostUsdThisMonth)} dépensés
                ce mois-ci contre un plafond de {costs.hardCapEur} € (AI_MONTHLY_HARD_CAP_EUR).
                Les scans automatiques s&apos;arrêtent jusqu&apos;au mois prochain.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              <StatCard label="Coût IA total — ce mois-ci" value={usd(costs.totalCostUsdThisMonth)} />
              <StatCard
                label="Coût moyen — standard"
                value={costs.avgCostByKind.standard !== null ? usd(costs.avgCostByKind.standard) : "—"}
              />
              <StatCard
                label="Coût moyen — approfondie"
                value={costs.avgCostByKind.deep !== null ? usd(costs.avgCostByKind.deep) : "—"}
              />
              <StatCard label="Coût des scans automatiques" value={usd(costs.scanCostUsdThisMonth)} />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#12151b]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Utilisateur</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Prix</th>
                    <th className="px-4 py-3">Coût IA ce mois-ci</th>
                    <th className="px-4 py-3">Marge estimée</th>
                  </tr>
                </thead>
                <tbody>
                  {costs.perUser.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                        Aucun utilisateur n&apos;a généré de coût IA ce mois-ci.
                      </td>
                    </tr>
                  ) : (
                    costs.perUser.map((row) => (
                      <tr key={row.userId} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-3 text-slate-300">{row.email ?? row.userId}</td>
                        <td className="px-4 py-3 text-slate-300">{row.plan ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {row.priceEur !== null ? `${row.priceEur.toFixed(2)} €` : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-300">{usd(row.aiCostUsdThisMonth)}</td>
                        <td
                          className={`px-4 py-3 font-semibold ${
                            row.underMarginFloor ? "text-red-400" : "text-slate-300"
                          }`}
                        >
                          {row.estimatedMarginPercent !== null
                            ? `${row.estimatedMarginPercent.toFixed(0)} %${row.underMarginFloor ? " ⚠" : ""}`
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-500">
              Marge estimée = (prix − frais Stripe estimés − coût IA) / prix. Les
              frais Stripe sont une estimation (voir STRIPE_FEE_PERCENT /
              STRIPE_FEE_FIXED_EUR dans src/lib/data/pricing.ts) — à confirmer
              contre le contrat Stripe réel. Les utilisateurs marqués ⚠ sont sous
              le plancher de marge de 65 %.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
