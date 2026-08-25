"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { CopySettingsForm } from "@/components/dashboard/smart-wallets/copy-settings-form";
import { DEFAULT_SIGNAL_COPY_SETTINGS, type SignalCopySettings } from "@/lib/data/signal-copy-trading";
import { SIGNAL_SOURCE_LABELS, type SignalWallet } from "@/lib/data/signal-wallets";
import { cn } from "@/lib/utils";

export function MySmartWalletsFlow({
  wallets,
  settingsByWalletId,
  hasActiveSubscription,
  cancelled,
}: {
  wallets: SignalWallet[];
  settingsByWalletId: Map<string, SignalCopySettings>;
  hasActiveSubscription: boolean;
  cancelled: boolean;
}) {
  const [settings, setSettings] = useState(settingsByWalletId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [unfollowing, setUnfollowing] = useState<string | null>(null);
  const [followedIds, setFollowedIds] = useState(new Set(wallets.map((w) => w.id)));

  const unfollow = async (walletId: string) => {
    setUnfollowing(walletId);
    try {
      const response = await fetch("/api/signal-wallets/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId }),
      });
      if (!response.ok) throw new Error();
      setFollowedIds((prev) => {
        const next = new Set(prev);
        next.delete(walletId);
        return next;
      });
    } catch {
      // no-op: leave the wallet in the list, user can retry
    } finally {
      setUnfollowing(null);
    }
  };

  const visibleWallets = wallets.filter((w) => followedIds.has(w.id));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Mes Smart Wallets
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Gérez vos wallets suivis et activez le Copy Trading — chaque trade détecté est analysé
          par l&apos;IA PolyPips et vérifié par le Risk Engine avant toute copie (mode démo).
        </p>
      </div>

      <LockedOverlay
        locked={!hasActiveSubscription}
        cancelled={cancelled}
        message={
          cancelled
            ? "Abonnement annulé — réabonnez-vous pour gérer vos Smart Wallets."
            : "Débloquez le suivi et le Copy Trading Smart Wallets. Débutez pour 0,99 €"
        }
      >
        {visibleWallets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <p className="text-sm font-semibold text-white">Aucun Smart Wallet suivi pour le moment</p>
            <p className="max-w-sm text-xs leading-relaxed text-white/45">
              Rendez-vous sur la page Smart Wallets pour en découvrir et en suivre.
            </p>
            <Button href="/dashboard/smart-wallets" className="mt-2">
              Découvrir les Smart Wallets
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleWallets.map((wallet) => {
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
                        onClick={() => unfollow(wallet.id)}
                        disabled={unfollowing === wallet.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-white/50 transition-colors hover:border-rose-400/30 hover:text-rose-300"
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
      </LockedOverlay>
    </div>
  );
}
