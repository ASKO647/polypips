"use client";

import { useMemo, useState } from "react";
import { Wallet as WalletIcon } from "lucide-react";
import { AddWalletForm } from "@/components/dashboard/smart-money/add-wallet-form";
import { WalletCard } from "@/components/dashboard/smart-money/wallet-card";
import { WalletDetail } from "@/components/dashboard/smart-money/wallet-detail";
import type { Wallet } from "@/lib/data/smart-money";
import { cn } from "@/lib/utils";

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
  maxTrackedWallets,
}: {
  wallets: Wallet[];
  initialFollowedIds: string[];
  hasActiveSubscription: boolean;
  maxTrackedWallets: number | null;
}) {
  const [allWallets, setAllWallets] = useState(wallets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [followedIds, setFollowedIds] = useState<Set<string>>(
    new Set(initialFollowedIds)
  );
  const [sortKey, setSortKey] = useState<SortKey>("totalValue");
  const [followError, setFollowError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const sortedWallets = useMemo(
    () =>
      [...allWallets].sort((a, b) =>
        sortKey === "changePercent"
          ? Math.abs(b.changePercent) - Math.abs(a.changePercent)
          : b[sortKey] - a[sortKey]
      ),
    [allWallets, sortKey]
  );

  const toggleFollow = async (walletId: string) => {
    if (pendingId) return;
    setFollowError(null);
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
              changePercent: 0,
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
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
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

      <AddWalletForm onAdded={handleWalletAdded} />

      {followError && (
        <p className="rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-4 py-3 text-xs text-rose-300">
          {followError}
        </p>
      )}

      {maxTrackedWallets !== null && (
        <p className="text-xs text-white/35">
          Vous suivez {followedIds.size} / {maxTrackedWallets} portefeuille(s)
          autorisé(s) par votre offre.
        </p>
      )}

      {allWallets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
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
          <div className="flex flex-wrap items-center gap-2">
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedWallets.map((wallet) => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                isFollowed={followedIds.has(wallet.id)}
                onToggleFollow={() => toggleFollow(wallet.id)}
                onViewDetail={() => setSelectedId(wallet.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
