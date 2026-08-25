"use client";

import { useMemo, useState } from "react";
import { Wallet as WalletIcon } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { DemoDataBanner } from "@/components/dashboard/smart-wallets/demo-data-banner";
import { WalletCard } from "@/components/dashboard/smart-wallets/wallet-card";
import { WalletFilters } from "@/components/dashboard/smart-wallets/wallet-filters";
import type { SignalSource, SignalWallet, SignalWalletSort, SignalWinRateFilter } from "@/lib/data/signal-wallets";

type SourceFilter = "all" | SignalSource;

function applyFilters(
  wallets: SignalWallet[],
  source: SourceFilter,
  winRate: SignalWinRateFilter,
  search: string,
  sort: SignalWalletSort
): SignalWallet[] {
  let result = wallets;
  if (source !== "all") result = result.filter((w) => w.source === source);
  if (winRate !== "all") {
    result = result.filter((w) => w.winRate !== null && w.winRate >= winRate);
  }
  if (search.trim() !== "") {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (w) => w.label.toLowerCase().includes(q) || w.address.toLowerCase().includes(q)
    );
  }

  return [...result].sort((a, b) => {
    if (sort === "winRate") return (b.winRate ?? -1) - (a.winRate ?? -1);
    if (sort === "pnl") return (b.pnl7d ?? -Infinity) - (a.pnl7d ?? -Infinity);
    if (sort === "activity") return (b.tradesCount ?? 0) - (a.tradesCount ?? 0);
    return (b.polypipsScore ?? -1) - (a.polypipsScore ?? -1);
  });
}

export function SmartWalletsFlow({
  wallets,
  initialFollowedIds,
  hasActiveSubscription,
  cancelled,
}: {
  wallets: SignalWallet[];
  initialFollowedIds: string[];
  hasActiveSubscription: boolean;
  cancelled: boolean;
}) {
  const router = useRouter();
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set(initialFollowedIds));
  const [source, setSource] = useState<SourceFilter>("all");
  const [winRate, setWinRate] = useState<SignalWinRateFilter>("all");
  const [sort, setSort] = useState<SignalWalletSort>("score");
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [followError, setFollowError] = useState<string | null>(null);

  const filtered = useMemo(
    () => applyFilters(wallets, source, winRate, search, sort),
    [wallets, source, winRate, search, sort]
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
      const response = await fetch("/api/signal-wallets/follow", {
        method: isFollowed ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Une erreur est survenue.");
    } catch (err) {
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

  const anyMock = wallets.some((w) => w.dataSourceMode === "mock");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Smart Wallets
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Les wallets memecoins les plus performants, repérés via Fomo et Axiom — analysez,
          suivez, et activez le Copy Trading.
        </p>
      </div>

      {anyMock && <DemoDataBanner />}

      <LockedOverlay
        locked={!hasActiveSubscription}
        cancelled={cancelled}
        message={
          cancelled
            ? "Abonnement annulé — réabonnez-vous pour continuer à utiliser Smart Wallets."
            : "Débloquez Smart Wallets — suivez les meilleurs wallets Fomo/Axiom. Débutez pour 0,99 €"
        }
      >
        <WalletFilters
          source={source}
          onSourceChange={setSource}
          winRate={winRate}
          onWinRateChange={setWinRate}
          sort={sort}
          onSortChange={setSort}
          search={search}
          onSearchChange={setSearch}
        />

        {followError && (
          <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-4 py-3 text-xs text-rose-300">
            {followError}
          </p>
        )}

        {filtered.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
              <WalletIcon className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="text-sm font-semibold text-white">Aucun wallet ne correspond à ces filtres</p>
            <p className="max-w-sm text-xs leading-relaxed text-white/45">
              Essayez d&apos;élargir vos filtres, ou revenez plus tard — de nouveaux wallets sont
              repérés à chaque synchronisation.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((wallet) => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                isFollowed={followedIds.has(wallet.id)}
                onToggleFollow={() => toggleFollow(wallet.id)}
                onViewDetail={() => router.push(`/dashboard/smart-wallets/${wallet.id}`)}
              />
            ))}
          </div>
        )}
      </LockedOverlay>
    </div>
  );
}
