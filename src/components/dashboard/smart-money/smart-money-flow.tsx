"use client";

import { useMemo, useState } from "react";
import { Wallet as WalletIcon } from "lucide-react";
import { AddWalletForm } from "@/components/dashboard/smart-money/add-wallet-form";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { WalletCard } from "@/components/dashboard/smart-money/wallet-card";
import { WalletDetail } from "@/components/dashboard/smart-money/wallet-detail";
import { SmartMoneySyncCountdown } from "@/components/dashboard/smart-money/sync-countdown";
import type { Wallet } from "@/lib/data/smart-money";
import { cn, formatResetDate } from "@/lib/utils";

type SortKey = "totalValue" | "changePercent" | "activePositionsCount";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "totalValue", label: "Valeur" },
  { key: "changePercent", label: "Évolution" },
  { key: "activePositionsCount", label: "Positions" },
];

export function SmartMoneyFlow({
  wallets,
  initialFollowedIds,
  hasActiveSubscription,
  cancelled,
  maxTrackedWallets,
  quotaLocked,
  quotaResetDate,
  lastSyncedAt,
}: {
  wallets: Wallet[];
  initialFollowedIds: string[];
  hasActiveSubscription: boolean;
  /** True when access is blocked because the user cancelled — swaps the
   * "Débutez pour 0,99 €" first-time CTA for a "réabonnez-vous" one. */
  cancelled: boolean;
  maxTrackedWallets: number | null;
  /** True once the user has followed maxTrackedWallets wallets in the
   * current billing cycle — follow AND unfollow are both blocked until
   * the subscription renews (see lib/supabase/quota-cycles.ts). Always
   * false now: both plans are unlimited on this quota
   * (maxTrackedWallets === null). */
  quotaLocked: boolean;
  quotaResetDate: string | null;
  /** Most recent last_synced_at across the tracked pool — seeds the
   * "Prochains marchés dans" countdown. Null before the first sync ever
   * ran. */
  lastSyncedAt: string | null;
}) {
  const [allWallets, setAllWallets] = useState(wallets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [followedIds, setFollowedIds] = useState<Set<string>>(
    new Set(initialFollowedIds)
  );
  const [sortKey, setSortKey] = useState<SortKey>("totalValue");
  const [followError, setFollowError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const lockMessage = quotaLocked
    ? `Vous avez atteint votre limite mensuelle (${followedIds.size}/${maxTrackedWallets} wallets). Passez à un plan supérieur pour en suivre davantage${
        quotaResetDate ? `, ou attendez le renouvellement le ${formatResetDate(quotaResetDate)}` : ""
      }.`
    : null;

  const sortedWallets = useMemo(
    () =>
      [...allWallets].sort((a, b) =>
        sortKey === "changePercent"
          ? Math.abs(b.changePercent ?? 0) - Math.abs(a.changePercent ?? 0)
          : b[sortKey] - a[sortKey]
      ),
    [allWallets, sortKey]
  );

  const toggleFollow = async (walletId: string) => {
    if (pendingId) return;
    setFollowError(null);

    if (quotaLocked) {
      setFollowError(lockMessage);
      return;
    }

    const isFollowed = followedIds.has(walletId);

    setPendingId(walletId);
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (isFollowed) next.delete(walletId);
      else next.add(walletId);
      return next;
    });

    try {
      const response = await fetch("/api/wallets/follow", {
        method: isFollowed ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue.");
      }
    } catch (err) {
      // Roll back the optimistic update on failure.
      setFollowedIds((prev) => {
        const next = new Set(prev);
        if (isFollowed) next.add(walletId);
        else next.delete(walletId);
        return next;
      });
      setFollowError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setPendingId(null);
    }
  };

  const handleWalletAdded = (walletId: string) => {
    setFollowedIds((prev) => new Set(prev).add(walletId));
    setAllWallets((prev) =>
      prev.some((w) => w.id === walletId)
        ? prev
        : [
            ...prev,
            {
              id: walletId,
              address: "",
              handle: "Nouveau portefeuille",
              source: "user_added",
              totalValue: 0,
              changePercent: null,
              activePositionsCount: 0,
              marketsTrackedCount: 0,
              chart: [0, 0],
              positions: [],
              recentMovements: [],
              history: [],
              lastSyncedAt: null,
            },
          ]
    );
  };

  const selected = selectedId
    ? (allWallets.find((w) => w.id === selectedId) ?? null)
    : null;

  if (selected) {
    return (
      <WalletDetail
        wallet={selected}
        isFollowed={followedIds.has(selected.id)}
        onToggleFollow={() => toggleFollow(selected.id)}
        onBack={() => setSelectedId(null)}
        locked={!hasActiveSubscription}
        toggleDisabled={quotaLocked}
        toggleDisabledReason={lockMessage}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Smart Money
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
            Suivez les portefeuilles les plus actifs de Polymarket, repérés et
            rafraîchis automatiquement à partir de leurs données publiques
            on-chain.
          </p>
        </div>
        <SmartMoneySyncCountdown lastSyncedAt={lastSyncedAt} />
      </div>

      <LockedOverlay
        locked={!hasActiveSubscription}
        cancelled={cancelled}
        message={
          cancelled
            ? "Abonnement annulé — réabonnez-vous pour continuer à utiliser Smart Money."
            : "Débloquez Smart Money — suivez les portefeuilles les plus actifs de Polymarket. Débutez pour 0,99 €"
        }
      >
        <AddWalletForm onAdded={handleWalletAdded} disabled={quotaLocked} />

        {followError && (
          <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-4 py-3 text-xs text-rose-300">
            {followError}
          </p>
        )}

        {maxTrackedWallets !== null && (
          <div
            className={cn(
              "mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-xs font-semibold",
              quotaLocked
                ? "border-amber-400/20 bg-amber-500/[0.06] text-amber-200"
                : "border-white/10 bg-white/[0.03] text-white/50"
            )}
          >
            <span>
              {followedIds.size}/{maxTrackedWallets} wallets suivis ce mois-ci
            </span>
            {quotaLocked && (
              <span className="text-amber-300">
                Sélection verrouillée
                {quotaResetDate ? ` jusqu'au ${formatResetDate(quotaResetDate)}` : ""}
              </span>
            )}
          </div>
        )}

        {allWallets.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
              <WalletIcon className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="text-sm font-semibold text-white">
              Aucun portefeuille suivi pour le moment
            </p>
            <p className="max-w-sm text-xs leading-relaxed text-white/45">
              Notre système repère périodiquement les portefeuilles les plus
              actifs sur Polymarket. Revenez un peu plus tard, ou ajoutez
              vous-même une adresse à suivre ci-dessus.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-white/40">Trier par</span>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSortKey(opt.key)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
                    sortKey === opt.key
                      ? "border-white/25 bg-white/[0.1] text-white"
                      : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedWallets.map((wallet) => (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  isFollowed={followedIds.has(wallet.id)}
                  onToggleFollow={() => toggleFollow(wallet.id)}
                  onViewDetail={() => setSelectedId(wallet.id)}
                  toggleDisabled={quotaLocked}
                  toggleDisabledReason={lockMessage}
                />
              ))}
            </div>
          </>
        )}
      </LockedOverlay>
    </div>
  );
}
