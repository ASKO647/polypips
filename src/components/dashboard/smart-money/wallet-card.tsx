"use client";

import { ArrowRight, Check, Lock, Plus } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { ChangeBadge } from "@/components/dashboard/smart-money/change-badge";
import type { Wallet } from "@/lib/data/smart-money";
import { cn, formatEUR } from "@/lib/utils";

export function WalletCard({
  wallet,
  isFollowed,
  onToggleFollow,
  onViewDetail,
  toggleDisabled = false,
  toggleDisabledReason,
}: {
  wallet: Wallet;
  isFollowed: boolean;
  onToggleFollow: () => void;
  onViewDetail: () => void;
  /** True once the user's monthly wallet quota is locked — follow AND
   * unfollow are both blocked until the subscription renews. */
  toggleDisabled?: boolean;
  toggleDisabledReason?: string | null;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-base font-bold text-white">
              {wallet.handle}
            </p>
            {wallet.source === "user_added" && (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/40">
                Ajouté par vous
              </span>
            )}
          </div>
          <p className="mt-1 text-xl font-bold text-white">
            {formatEUR(wallet.totalValue)}
          </p>
        </div>
        <ChangeBadge changePercent={wallet.changePercent} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-white/35">Positions actives</p>
          <p className="mt-0.5 font-semibold text-white">
            {wallet.activePositionsCount}
          </p>
        </div>
        <div>
          <p className="text-white/35">Marchés suivis</p>
          <p className="mt-0.5 font-semibold text-white">
            {wallet.marketsTrackedCount}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onToggleFollow}
          disabled={toggleDisabled}
          title={toggleDisabled ? (toggleDisabledReason ?? undefined) : undefined}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors duration-150",
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
        <Button
          type="button"
          variant="outline"
          onClick={onViewDetail}
          className="flex-1"
        >
          Voir le détail
          <ButtonIcon variant="outline">
            <ArrowRight className="h-4 w-4" />
          </ButtonIcon>
        </Button>
      </div>
    </div>
  );
}
