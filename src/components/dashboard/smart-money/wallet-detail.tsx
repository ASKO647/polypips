"use client";

import { Check, Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { WalletChart } from "@/components/dashboard/smart-money/wallet-chart";
import type {
  Wallet,
  WalletMovement,
  WalletPosition,
} from "@/lib/data/smart-money";
import { cn, formatEUR, formatSignedEUR } from "@/lib/utils";

function MovementRow({ movement }: { movement: WalletMovement }) {
  const positive = movement.type === "Achat";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            "text-xs font-semibold",
            positive ? "text-emerald-400" : "text-rose-400"
          )}
        >
          {movement.type}
        </span>
        <p className="truncate text-sm text-white/75">{movement.market}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span
          className={cn(
            "text-sm font-bold",
            positive ? "text-emerald-400" : "text-rose-400"
          )}
        >
          {positive ? "+" : "-"}
          {formatEUR(movement.amount)}
        </span>
        <span className="text-[11px] text-white/35">{movement.timeAgo}</span>
      </div>
    </div>
  );
}

function PositionRow({ position }: { position: WalletPosition }) {
  const gain = position.pnl >= 0;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="truncate text-sm text-white/85">{position.market}</p>
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
            position.side === "YES"
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-rose-500/15 text-rose-400"
          )}
        >
          {position.side}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-sm font-semibold text-white">
          {formatEUR(position.amount)}
        </span>
        <span
          className={cn(
            "text-xs font-bold",
            gain ? "text-emerald-400" : "text-rose-400"
          )}
        >
          {formatSignedEUR(position.pnl)}
        </span>
      </div>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-white/35">
      {label}
    </p>
  );
}

export function WalletDetail({
  wallet,
  isFollowed,
  onToggleFollow,
  onBack,
  locked = false,
  toggleDisabled = false,
  toggleDisabledReason,
}: {
  wallet: Wallet;
  isFollowed: boolean;
  onToggleFollow: () => void;
  onBack: () => void;
  /** True when the viewer has no active subscription — see LockedOverlay. */
  locked?: boolean;
  /** True once the user's monthly wallet quota is locked — follow AND
   * unfollow are both blocked until the subscription renews. */
  toggleDisabled?: boolean;
  toggleDisabledReason?: string | null;
}) {
  // The sparkline's own trend (does it end above where it started?) is a
  // separate signal from changePercent — it stays meaningful even before
  // there's enough history for a real change_percent (see the flat
  // 2-point fallback chart built in lib/supabase/wallets.ts).
  const chartPositive = wallet.chart.length < 2 || wallet.chart.at(-1)! >= wallet.chart[0];
  const hasChange = wallet.changePercent !== null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-xl font-bold text-white sm:text-2xl">
            {wallet.handle}
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold text-white">
              {formatEUR(wallet.totalValue)}
            </span>
            <span
              className={cn(
                "text-sm font-bold",
                !hasChange
                  ? "text-white/35"
                  : wallet.changePercent! >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
              )}
            >
              {!hasChange
                ? "— (historique insuffisant)"
                : `${wallet.changePercent! >= 0 ? "+" : ""}${wallet.changePercent!.toFixed(1)}%`}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleFollow}
          disabled={toggleDisabled}
          title={toggleDisabled ? (toggleDisabledReason ?? undefined) : undefined}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors duration-150",
            toggleDisabled
              ? "cursor-not-allowed border-white/10 bg-white/[0.02] text-white/30"
              : isFollowed
                ? "border-brand-400 bg-brand-500/15 text-brand-400"
                : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white"
          )}
        >
          {toggleDisabled ? (
            <Lock className="h-3.5 w-3.5" />
          ) : isFollowed ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {isFollowed ? "Ne plus suivre" : "Suivre ce wallet"}
        </button>
      </div>

      <LockedOverlay
        locked={locked}
        message="Le détail des positions, des mouvements et l'historique de ce portefeuille sont réservés aux abonnés."
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
            Profil du portefeuille
          </p>
          {wallet.winRate === null &&
          wallet.roiPercent === null &&
          wallet.consistencyScore === null &&
          wallet.riskLevel === null ? (
            <p className="mt-2 text-xs text-white/35">
              Pas encore de profil calculé — disponible après la première
              actualisation de ce portefeuille.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
              <div>
                <p className="text-white/35">Win rate</p>
                <p className="mt-0.5 font-semibold text-white">
                  {wallet.winRate !== null ? `${Math.round(wallet.winRate * 100)}%` : "—"}
                </p>
              </div>
              <div>
                <p className="text-white/35">ROI</p>
                <p
                  className={cn(
                    "mt-0.5 font-semibold",
                    wallet.roiPercent === null
                      ? "text-white"
                      : wallet.roiPercent >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                  )}
                >
                  {wallet.roiPercent !== null
                    ? `${wallet.roiPercent >= 0 ? "+" : ""}${wallet.roiPercent.toFixed(1)}%`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-white/35">Consistance</p>
                <p className="mt-0.5 font-semibold text-white">
                  {wallet.consistencyScore !== null ? `${wallet.consistencyScore}/100` : "—"}
                </p>
              </div>
              <div>
                <p className="text-white/35">Diversification</p>
                <p className="mt-0.5 font-semibold text-white">
                  {wallet.categoryDiversity !== null
                    ? `${wallet.categoryDiversity} catégorie${wallet.categoryDiversity > 1 ? "s" : ""}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-white/35">Risque</p>
                <p className="mt-0.5 font-semibold capitalize text-white">
                  {wallet.riskLevel === "low"
                    ? "Faible"
                    : wallet.riskLevel === "high"
                      ? "Élevé"
                      : wallet.riskLevel === "medium"
                        ? "Moyen"
                        : "—"}
                </p>
              </div>
              <div>
                <p className="text-white/35">Taille moyenne</p>
                <p className="mt-0.5 font-semibold text-white">
                  {wallet.avgPositionSize !== null ? formatEUR(wallet.avgPositionSize) : "—"}
                </p>
              </div>
              <div>
                <p className="text-white/35">Track record</p>
                <p className="mt-0.5 font-semibold text-white">
                  {wallet.trackRecordDays !== null ? `${wallet.trackRecordDays} j.` : "—"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
            Évolution — valeur du portefeuille
          </p>
          <div className="mt-4 h-32 sm:h-40">
            <WalletChart points={wallet.chart} positive={chartPositive} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
            Positions actuelles
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {wallet.positions.length === 0 ? (
              <EmptyRow label="Aucune position ouverte pour le moment." />
            ) : (
              wallet.positions.map((position) => (
                <PositionRow key={position.id} position={position} />
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
            Mouvements récents
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {wallet.recentMovements.length === 0 ? (
              <EmptyRow label="Aucun mouvement récent détecté." />
            ) : (
              wallet.recentMovements.map((movement) => (
                <MovementRow key={movement.id} movement={movement} />
              ))
            )}
          </div>
        </div>

        {wallet.history.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Historique
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {wallet.history.map((movement) => (
                <MovementRow key={movement.id} movement={movement} />
              ))}
            </div>
          </div>
        )}
      </LockedOverlay>

      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        className="sm:self-start sm:px-8"
      >
        Retour à la liste
      </Button>
    </div>
  );
}
