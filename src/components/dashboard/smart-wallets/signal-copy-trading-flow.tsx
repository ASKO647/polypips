"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Wallet as WalletIcon, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { DemoDataBanner } from "@/components/dashboard/smart-wallets/demo-data-banner";
import { CopySettingsForm } from "@/components/dashboard/smart-wallets/copy-settings-form";
import { WalletCard } from "@/components/dashboard/smart-wallets/wallet-card";
import { WalletFilters } from "@/components/dashboard/smart-wallets/wallet-filters";
import { DEFAULT_SIGNAL_COPY_SETTINGS, type SignalCopySettings } from "@/lib/data/signal-copy-trading";
import {
  SIGNAL_SOURCE_LABELS,
  type SignalSource,
  type SignalWallet,
  type SignalWalletSort,
  type SignalWinRateFilter,
} from "@/lib/data/signal-wallets";
import { cn } from "@/lib/utils";

type SourceFilter = "all" | SignalSource;

/**
 * Fomo/Axiom's counterpart to Polymarket's Copy Trading + wallet lookup
 * merge: "Smart Wallet" (the standalone browse/filter/follow page) isn't
 * its own nav entry anymore — its exact same grid, filters and follow
 * toggle now live at the top of this page, with "Mes wallets suivis" (the
 * followed list + per-wallet risk settings, formerly "Mes Smart Wallets")
 * right below it. One place to find a wallet, one place to configure Copy
 * Trading for it — nothing from the old page is lost, only relocated.
 *
 * Unlike Polymarket, this does NOT gain an address-paste lookup: neither
 * Fomo nor Axiom has an official API, so there's no way to fetch live
 * data for an arbitrary address on demand (see the Copy Trading
 * simplification this module already went through). Discovery here stays
 * exactly what it always was — wallets sync-signal-wallets already found.
 */
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

export function SignalCopyTradingFlow({
  allWallets,
  initialFollowedIds,
  settingsByWalletId,
  hasActiveSubscription,
  cancelled,
}: {
  allWallets: SignalWallet[];
  initialFollowedIds: string[];
  settingsByWalletId: Map<string, SignalCopySettings>;
  hasActiveSubscription: boolean;
  cancelled: boolean;
}) {
  const router = useRouter();
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set(initialFollowedIds));
  const [settings, setSettings] = useState(settingsByWalletId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [followError, setFollowError] = useState<string | null>(null);

  const [source, setSource] = useState<SourceFilter>("all");
  const [winRate, setWinRate] = useState<SignalWinRateFilter>("all");
  const [sort, setSort] = useState<SignalWalletSort>("score");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => applyFilters(allWallets, source, winRate, search, sort),
    [allWallets, source, winRate, search, sort]
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

  const anyMock = allWallets.some((w) => w.dataSourceMode === "mock");
  const followedWallets = allWallets.filter((w) => followedIds.has(w.id));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Copy Trading
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Trouvez un Smart Wallet Fomo ou Axiom, suivez-le, puis activez le Copy Trading — chaque
          trade détecté est analysé par l&apos;IA PolyPips et vérifié par le Risk Engine avant de
          générer une suggestion.
        </p>
      </div>

      {anyMock && <DemoDataBanner />}

      <LockedOverlay
        locked={!hasActiveSubscription}
        cancelled={cancelled}
        message={
          cancelled
            ? "Abonnement annulé — réabonnez-vous pour continuer à utiliser le Copy Trading."
            : "Débloquez le Copy Trading Smart Wallets. Débutez pour 0,99 €"
        }
      >
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-base font-bold text-white">Découvrir des Smart Wallets</h2>
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
            <p className="rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-4 py-3 text-xs text-rose-300">
              {followError}
            </p>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-8">
          <h2 className="font-display text-base font-bold text-white">Mes wallets suivis</h2>

          {followedWallets.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
              <p className="text-sm font-semibold text-white">Aucun Smart Wallet suivi pour le moment</p>
              <p className="max-w-sm text-xs leading-relaxed text-white/45">
                Suivez un wallet ci-dessus pour activer le Copy Trading dessus.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {followedWallets.map((wallet) => {
                const walletSettings =
                  settings.get(wallet.id) ?? { id: null, walletId: wallet.id, ...DEFAULT_SIGNAL_COPY_SETTINGS };
                const expanded = expandedId === wallet.id;

                return (
                  <div key={wallet.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-display text-base font-bold text-white">{wallet.label}</p>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/40">
                            {SIGNAL_SOURCE_LABELS[wallet.source]}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                              walletSettings.enabled
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-white/[0.06] text-white/40"
                            )}
                          >
                            {walletSettings.enabled ? "Copy Trading actif" : "Copy Trading inactif"}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-xs text-white/40">{wallet.shortAddress}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleFollow(wallet.id)}
                          disabled={pendingId === wallet.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-white/50 transition-colors hover:border-rose-400/30 hover:text-rose-300 disabled:opacity-60"
                        >
                          <X className="h-3.5 w-3.5" />
                          Ne plus suivre
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : wallet.id)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/25 hover:text-white"
                        >
                          {walletSettings.enabled ? "Gérer le Copy Trading" : "Activer le Copy Trading"}
                          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-4">
                        <CopySettingsForm
                          walletId={wallet.id}
                          initial={walletSettings}
                          onSaved={(saved) => {
                            setSettings((prev) => new Map(prev).set(wallet.id, saved));
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </LockedOverlay>
    </div>
  );
}
