"use client";

import { useState } from "react";
import { ExternalLink, TrendingDown, TrendingUp, Users, X } from "lucide-react";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { WalletLookupPanel } from "@/components/dashboard/copy-trading/wallet-lookup-panel";
import type { Wallet } from "@/lib/data/smart-money";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function FollowedWalletCard({
  wallet,
  onViewDetail,
  onUnfollow,
  unfollowPending,
}: {
  wallet: Wallet;
  onViewDetail: () => void;
  onUnfollow: () => void;
  unfollowPending: boolean;
}) {
  const { formatAmount } = useCurrency();
  const changeKnown = wallet.changePercent !== null;
  const positive = changeKnown && (wallet.changePercent as number) >= 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{wallet.handle}</p>
          <p className="text-[11px] text-white/35">{shortAddress(wallet.address)}</p>
        </div>
        <button
          type="button"
          onClick={onUnfollow}
          disabled={unfollowPending}
          aria-label="Ne plus suivre ce wallet"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/40 transition-colors hover:border-rose-400/40 hover:text-rose-400 disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-bold text-white">{formatAmount(wallet.totalValue)}</p>
        {changeKnown ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-bold",
              positive ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {positive ? "+" : ""}
            {(wallet.changePercent as number).toFixed(1)}%
          </span>
        ) : (
          <span className="text-xs text-white/30">Pas encore de données</span>
        )}
      </div>

      <p className="text-xs text-white/40">{wallet.activePositionsCount} position(s) ouverte(s)</p>

      <button
        type="button"
        onClick={onViewDetail}
        className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-brand-400 transition-colors hover:text-brand-300"
      >
        Voir le détail
        <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  );
}

export function SmartWalletFlow({
  followedWallets: initialFollowedWallets,
  hasActiveSubscription,
  cancelled,
}: {
  followedWallets: Wallet[];
  hasActiveSubscription: boolean;
  /** True when access is blocked because the user cancelled — swaps the
   * "Débutez pour 0,99 €" first-time CTA for a "réabonnez-vous" one. */
  cancelled: boolean;
}) {
  const [followedWallets, setFollowedWallets] = useState(initialFollowedWallets);
  const [error, setError] = useState<string | null>(null);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);
  const [prefillAddress, setPrefillAddress] = useState<{ address: string; key: number } | undefined>();

  const handleWalletFollowed = (walletId: string, label: string, address: string) => {
    setFollowedWallets((prev) =>
      prev.some((w) => w.id === walletId)
        ? prev
        : [
            {
              id: walletId,
              address,
              handle: label,
              source: "user_added",
              totalValue: 0,
              changePercent: null,
              activePositionsCount: 0,
              marketsTrackedCount: 0,
              chart: [],
              positions: [],
              recentMovements: [],
              history: [],
              lastSyncedAt: null,
              winRate: null,
              roiPercent: null,
              consistencyScore: null,
              categoryDiversity: null,
              avgPositionSize: null,
              riskLevel: null,
              trackRecordDays: null,
            },
            ...prev,
          ]
    );
  };

  const handleUnfollow = async (walletId: string) => {
    if (unfollowingId) return;
    setUnfollowingId(walletId);
    setError(null);
    try {
      const response = await fetch("/api/wallets/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Une erreur est survenue.");
      setFollowedWallets((prev) => prev.filter((w) => w.id !== walletId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setUnfollowingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Smart Wallet
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Recherchez un portefeuille Polymarket par adresse pour voir ses positions, son profil et
          son activité. Suivez-le pour être notifié dès qu&apos;il ouvre une nouvelle position — libre
          à vous de la répliquer vous-même sur Polymarket.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-4 py-3 text-xs text-rose-300">
          {error}
        </p>
      )}

      <LockedOverlay
        locked={!hasActiveSubscription}
        cancelled={cancelled}
        message={
          cancelled
            ? "Abonnement annulé — réabonnez-vous pour continuer à utiliser Smart Wallet."
            : "Débloquez Smart Wallet — Débutez pour 0,99 €"
        }
      >
        <WalletLookupPanel onWalletFollowed={handleWalletFollowed} prefillAddress={prefillAddress} />

        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-white">
            Wallets suivis {followedWallets.length > 0 && `(${followedWallets.length})`}
          </p>
          {followedWallets.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
                <Users className="h-5 w-5" strokeWidth={2} />
              </span>
              <p className="text-sm font-semibold text-white">Aucun wallet suivi pour l&apos;instant</p>
              <p className="max-w-sm text-xs leading-relaxed text-white/45">
                Recherchez un wallet Polymarket ci-dessus et suivez-le pour être notifié de ses
                prochains mouvements.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {followedWallets.map((wallet) => (
                <FollowedWalletCard
                  key={wallet.id}
                  wallet={wallet}
                  unfollowPending={unfollowingId === wallet.id}
                  onUnfollow={() => handleUnfollow(wallet.id)}
                  onViewDetail={() =>
                    setPrefillAddress((prev) => ({ address: wallet.address, key: (prev?.key ?? 0) + 1 }))
                  }
                />
              ))}
            </div>
          )}
        </div>
      </LockedOverlay>
    </div>
  );
}
