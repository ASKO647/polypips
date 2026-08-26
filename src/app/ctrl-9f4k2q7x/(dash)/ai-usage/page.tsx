import type { Metadata } from "next";
import { StatCard } from "@/components/owner/stat-card";
import { WalletChart } from "@/components/ui/wallet-chart";
import { fetchOwnerAiUsage } from "@/lib/supabase/owner-usage";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OwnerAiUsagePage() {
  const usage = await fetchOwnerAiUsage();
  const hasEvolution = usage.evolution30d.some((v) => v > 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-white">AI Usage</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Analyses — total" value={String(usage.analysesTotal)} />
        <StatCard label="Analyses — aujourd'hui" value={String(usage.analysesToday)} />
        <StatCard label="Messages Coach IA — total" value={String(usage.coachMessagesTotal)} />
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

      <p className="text-xs text-slate-500">
        Coût API Anthropic non disponible : les Edge Functions n&apos;enregistrent
        aucun coût par appel aujourd&apos;hui. Impossible d&apos;afficher un coût réel sans
        instrumenter cette donnée en plus.
      </p>
    </div>
  );
}
