"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Plus, Search } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { WalletChart } from "@/components/ui/wallet-chart";
import type { WalletLookupResult, WalletMovement, WalletPosition } from "@/lib/data/smart-money";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";

const WALLET_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function MovementRow({
  movement,
  formatAmount,
}: {
  movement: WalletMovement;
  formatAmount: (amountEur: number) => string;
}) {
  const t = useTranslations("Polymarket.WalletLookup.movementType");
  const positive = movement.type === "Achat";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={cn("text-xs font-semibold", positive ? "text-emerald-400" : "text-rose-400")}>
          {positive ? t("buy") : t("sell")}
        </span>
        <p className="truncate text-sm text-white/75">{movement.market}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className={cn("text-sm font-bold", positive ? "text-emerald-400" : "text-rose-400")}>
          {positive ? "+" : "-"}
          {formatAmount(movement.amount)}
        </span>
        <span className="text-[11px] text-white/35">{movement.timeAgo}</span>
      </div>
    </div>
  );
}

function PositionRow({
  position,
  formatAmount,
}: {
  position: WalletPosition;
  formatAmount: (amountEur: number, opts?: { signed?: boolean }) => string;
}) {
  const gain = position.pnl >= 0;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="truncate text-sm text-white/85">{position.market}</p>
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
            position.side === "YES" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
          )}
        >
          {position.side}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-sm font-semibold text-white">{formatAmount(position.amount)}</span>
        <span className={cn("text-xs font-bold", gain ? "text-emerald-400" : "text-rose-400")}>
          {formatAmount(position.pnl, { signed: true })}
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

export function WalletLookupPanel({
  onWalletFollowed,
  prefillAddress,
}: {
  /** Lets the followed-wallets list below react immediately once a
   * looked-up wallet gets followed, without a full page reload. */
  onWalletFollowed: (walletId: string, label: string, address: string) => void;
  /** Set (to a new address, or the same address again — see the effect's
   * own key handling below) to pre-fill and immediately re-run the search
   * — "voir le détail" on an already-followed wallet's card reuses this
   * same panel instead of duplicating its whole result view. */
  prefillAddress?: { address: string; key: number };
}) {
  const t = useTranslations("Polymarket.WalletLookup");
  const { formatAmount } = useCurrency();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WalletLookupResult | null>(null);
  const [followPending, setFollowPending] = useState(false);

  const performSearch = async (rawAddress: string) => {
    const trimmed = rawAddress.trim().toLowerCase();
    if (!WALLET_ADDRESS_RE.test(trimmed)) {
      setError(t("invalidAddress"));
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/copy-trading/wallet-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t("lookupError"));
      setResult(data as WalletLookupResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(address);
  };

  useEffect(() => {
    if (!prefillAddress) return;
    // A "voir le détail" click on a followed-wallet card outside this
    // component is exactly the kind of external event an effect should
    // synchronize from — not a derived-state anti-pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAddress(prefillAddress.address);
    performSearch(prefillAddress.address);
    // Only re-run when a new prefill request comes in (key changes) —
    // performSearch is intentionally omitted, it would re-run on every
    // render otherwise since it's redefined each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillAddress?.key]);

  const toggleFollow = async () => {
    if (!result || followPending) return;
    setFollowPending(true);
    const nextFollowed = !result.isFollowed;
    try {
      const response = await fetch("/api/wallets/follow", {
        method: nextFollowed ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          result.walletId ? { walletId: result.walletId } : { address: result.address }
        ),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t("genericError"));

      const walletId = (data.walletId as string) ?? result.walletId;
      setResult((prev) => (prev ? { ...prev, isFollowed: nextFollowed, walletId } : prev));
      if (nextFollowed && walletId) {
        onWalletFollowed(walletId, result.handle, result.address);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setFollowPending(false);
    }
  };

  const chartPoints = result?.dailyFlow.map((p) => p.value) ?? [];
  const chartLabels = result?.dailyFlow.map((p) => p.label) ?? [];
  const chartPositive = chartPoints.length === 0 || (chartPoints.at(-1) ?? 0) >= 0;

  const hasProfile =
    result &&
    (result.winRate !== null ||
      result.roiPercent !== null ||
      result.consistencyScore !== null ||
      result.riskLevel !== null);

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div>
        <p className="text-sm font-semibold text-white">{t("title")}</p>
        <p className="mt-1 text-xs text-white/45">
          {t("description")}
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t("addressPlaceholder")}
          disabled={loading}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none disabled:opacity-50"
        />
        <Button type="submit" disabled={loading || !address.trim()}>
          {loading ? t("searching") : t("searchButton")}
          <ButtonIcon>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</ButtonIcon>
        </Button>
      </form>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      {result && (
        <div className="flex flex-col gap-5 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-lg font-bold text-white sm:text-xl">{result.handle}</p>
              <p className="mt-1 font-display text-2xl font-bold text-white">{formatAmount(result.totalValue)}</p>
            </div>
            <button
              type="button"
              onClick={toggleFollow}
              disabled={followPending}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors duration-150 disabled:opacity-60",
                result.isFollowed
                  ? "border-brand-400 bg-brand-500/15 text-brand-400"
                  : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white"
              )}
            >
              {result.isFollowed ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {result.isFollowed ? t("followedButton") : t("followButton")}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{t("profileTitle")}</p>
            {!hasProfile ? (
              <p className="mt-2 text-xs text-white/35">
                {t("noProfileYet")}
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                <div>
                  <p className="text-white/35">{t("winRate")}</p>
                  <p className="mt-0.5 font-semibold text-white">
                    {result.winRate !== null ? `${Math.round(result.winRate * 100)}%` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-white/35">{t("roi")}</p>
                  <p
                    className={cn(
                      "mt-0.5 font-semibold",
                      result.roiPercent === null ? "text-white" : result.roiPercent >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {result.roiPercent !== null ? `${result.roiPercent >= 0 ? "+" : ""}${result.roiPercent.toFixed(1)}%` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-white/35">{t("consistency")}</p>
                  <p className="mt-0.5 font-semibold text-white">
                    {result.consistencyScore !== null ? `${result.consistencyScore}/100` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-white/35">{t("risk")}</p>
                  <p className="mt-0.5 font-semibold capitalize text-white">
                    {result.riskLevel === "low"
                      ? t("riskLevels.low")
                      : result.riskLevel === "high"
                        ? t("riskLevels.high")
                        : result.riskLevel === "medium"
                          ? t("riskLevels.medium")
                          : "—"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              {t("dailyFlowTitle")}
            </p>
            <div className="mt-4 h-32 sm:h-40">
              {chartPoints.length >= 2 ? (
                <WalletChart
                  points={chartPoints}
                  labels={chartLabels}
                  positive={chartPositive}
                  interactive
                  valueFormatter={(v) => formatAmount(v, { signed: true })}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-xs text-white/35">{t("notEnoughActivity")}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{t("positionsTitle")}</p>
            <div className="mt-3 flex flex-col gap-2">
              {result.positions.length === 0 ? (
                <EmptyRow label={t("noPositions")} />
              ) : (
                result.positions.map((position) => (
                  <PositionRow key={position.id} position={position} formatAmount={formatAmount} />
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{t("movementsTitle")}</p>
            <div className="mt-3 flex flex-col gap-2">
              {result.recentMovements.length === 0 ? (
                <EmptyRow label={t("noMovements")} />
              ) : (
                result.recentMovements.map((movement) => (
                  <MovementRow key={movement.id} movement={movement} formatAmount={formatAmount} />
                ))
              )}
            </div>
          </div>

          {result.history.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{t("historyTitle")}</p>
              <div className="mt-3 flex flex-col gap-2">
                {result.history.map((movement) => (
                  <MovementRow key={movement.id} movement={movement} formatAmount={formatAmount} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
