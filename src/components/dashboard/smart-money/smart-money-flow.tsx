"use client";

import { useMemo, useState } from "react";
import { WalletCard } from "@/components/dashboard/smart-money/wallet-card";
import { WalletDetail } from "@/components/dashboard/smart-money/wallet-detail";
import { MOCK_WALLETS } from "@/lib/data/smart-money";
import { cn } from "@/lib/utils";

type SortKey = "totalValue" | "changePercent" | "activePositionsCount";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "totalValue", label: "Valeur" },
  { key: "changePercent", label: "Évolution" },
  { key: "activePositionsCount", label: "Positions" },
];

export function SmartMoneyFlow() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("totalValue");

  const wallets = useMemo(
    () =>
      [...MOCK_WALLETS].sort((a, b) =>
        sortKey === "changePercent"
          ? Math.abs(b.changePercent) - Math.abs(a.changePercent)
          : b[sortKey] - a[sortKey]
      ),
    [sortKey]
  );

  const toggleFollow = (id: string) => {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selected = selectedId
    ? (MOCK_WALLETS.find((w) => w.id === selectedId) ?? null)
    : null;

  if (selected) {
    return (
      <WalletDetail
        wallet={selected}
        isFollowed={followedIds.has(selected.id)}
        onToggleFollow={() => toggleFollow(selected.id)}
        onBack={() => setSelectedId(null)}
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
          Suivez les portefeuilles les plus performants des marchés de
          prédiction.
        </p>
      </div>

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
        {wallets.map((wallet) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            isFollowed={followedIds.has(wallet.id)}
            onToggleFollow={() => toggleFollow(wallet.id)}
            onViewDetail={() => setSelectedId(wallet.id)}
          />
        ))}
      </div>
    </div>
  );
}
