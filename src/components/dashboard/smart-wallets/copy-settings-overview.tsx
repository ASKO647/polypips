"use client";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import type { SignalCopySettings } from "@/lib/data/signal-copy-trading";
import { SIGNAL_SOURCE_LABELS, type SignalWallet } from "@/lib/data/signal-wallets";
import { cn } from "@/lib/utils";

export function CopySettingsOverview({
  rows,
  hasActiveSubscription,
  cancelled,
}: {
  rows: { wallet: SignalWallet; settings: SignalCopySettings }[];
  hasActiveSubscription: boolean;
  cancelled: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Paramètres de Copy Trading
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Le Risk Engine applique toujours ces limites, quel que soit le score IA d&apos;un trade.
        </p>
      </div>

      <LockedOverlay
        locked={!hasActiveSubscription}
        cancelled={cancelled}
        message={
          cancelled
            ? "Abonnement annulé — réabonnez-vous pour gérer vos paramètres de Copy Trading."
            : "Débloquez les paramètres de Copy Trading. Débutez pour 0,99 €"
        }
      >
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <p className="text-sm font-semibold text-white">Aucun Copy Trading configuré</p>
            <p className="max-w-sm text-xs leading-relaxed text-white/45">
              Configurez vos limites de risque depuis la page &laquo; Mes Smart Wallets &raquo;
              pour les retrouver ici.
            </p>
            <Button href="/dashboard/smart-wallets/suivis" className="mt-2">
              Aller à Mes Smart Wallets
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.03] text-white/40">
                <tr>
                  <th className="px-4 py-3 font-semibold">Wallet</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Max / trade</th>
                  <th className="px-4 py-3 font-semibold">% copié</th>
                  <th className="px-4 py-3 font-semibold">Max / jour</th>
                  <th className="px-4 py-3 font-semibold">Positions max</th>
                  <th className="px-4 py-3 font-semibold">Slippage max</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ wallet, settings }) => (
                  <tr key={wallet.id} className="border-b border-white/5 text-white/75 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white">{wallet.label}</span>
                        <span className="text-[10px] text-white/35">{SIGNAL_SOURCE_LABELS[wallet.source]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          settings.enabled ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.06] text-white/40"
                        )}
                      >
                        {settings.enabled ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{settings.maxPositionAmount.toLocaleString("fr-FR")} $</td>
                    <td className="px-4 py-3">{settings.positionPercent}%</td>
                    <td className="px-4 py-3">{settings.maxDailyAmount.toLocaleString("fr-FR")} $</td>
                    <td className="px-4 py-3">{settings.maxSimultaneousPositions}</td>
                    <td className="px-4 py-3">{settings.maxSlippagePercent}%</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href="/dashboard/smart-wallets/suivis"
                        className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-white/70 transition-colors hover:border-white/25 hover:text-white"
                      >
                        Modifier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </LockedOverlay>
    </div>
  );
}
