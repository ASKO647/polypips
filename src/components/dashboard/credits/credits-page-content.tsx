"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ArrowDownCircle, ArrowUpCircle, BrainCircuit, Check, Loader2, RotateCcw, X } from "lucide-react";
import { useCurrency } from "@/providers/currency-provider";
import { CREDIT_PACK_ORDER, CREDIT_PACKS, pricePerCredit, type CreditPackId } from "@/lib/stripe/credit-packs";
import { formatRelativeTime } from "@/lib/supabase/analyses";
import type { CreditTransaction } from "@/lib/supabase/credits";
import { cn } from "@/lib/utils";

function PackCard({ packId, highlight }: { packId: CreditPackId; highlight?: "popular" | "value" }) {
  const t = useTranslations("Credits");
  const locale = useLocale();
  const { formatAmount } = useCurrency();
  const [pending, setPending] = useState(false);
  const pack = CREDIT_PACKS[packId];

  const handleBuy = async () => {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/stripe/credits-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack: packId, locale }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.message || t("genericError"));
      }
      window.location.assign(data.url);
    } catch {
      setPending(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-6",
        highlight ? "border-brand-400/50 bg-brand-500/[0.04]" : "border-dash-border bg-dash-surface"
      )}
    >
      <div className="flex items-center gap-2">
        <h3 className="font-display text-lg font-bold text-dash-text">{t(`packs.${packId}.name`)}</h3>
        {highlight && (
          <span className="rounded-full bg-brand-500/15 px-2.5 py-0.5 text-[11px] font-bold text-brand-400">
            {highlight === "popular" ? t("mostPopular") : t("bestValue")}
          </span>
        )}
      </div>
      <p className="text-sm text-dash-text-tertiary">{t(`packs.${packId}.description`)}</p>

      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-3xl font-bold text-dash-text">
          {formatAmount(pack.priceCents / 100)}
        </span>
      </div>
      <p className="-mt-2.5 text-sm text-dash-text-secondary">{t("creditsLabel", { count: pack.credits })}</p>
      <p className="text-xs text-dash-text-quaternary">
        {t("pricePerCredit", { price: formatAmount(pricePerCredit(pack)) })}
      </p>

      <button
        type="button"
        onClick={handleBuy}
        disabled={pending}
        className={cn(
          "mt-auto flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60",
          highlight
            ? "bg-brand-500 text-white hover:bg-brand-600"
            : "border border-dash-border-strong text-dash-text hover:border-dash-text-quaternary"
        )}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("buyButton")}
      </button>
    </div>
  );
}

const TRANSACTION_ICON: Record<CreditTransaction["type"], typeof ArrowUpCircle> = {
  purchase: ArrowUpCircle,
  consumption: ArrowDownCircle,
  refund: RotateCcw,
};

function TransactionRow({ tx }: { tx: CreditTransaction }) {
  const t = useTranslations("Credits");
  const Icon = TRANSACTION_ICON[tx.type];
  const positive = tx.amount > 0;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-dash-border bg-dash-surface px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            positive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-dash-text">{t(`History.${tx.type}`)}</span>
          <span className="text-xs text-dash-text-quaternary">{formatRelativeTime(tx.createdAt)}</span>
        </div>
      </div>
      <span className={cn("text-sm font-bold", positive ? "text-emerald-400" : "text-rose-400")}>
        {positive ? "+" : ""}
        {tx.amount}
      </span>
    </div>
  );
}

export function CreditsPageContent({
  balance,
  transactions,
}: {
  balance: number;
  transactions: CreditTransaction[];
}) {
  const t = useTranslations("Credits");
  const searchParams = useSearchParams();
  const purchaseStatus = searchParams.get("purchase");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-dash-text sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-dash-text-secondary sm:text-base">
          {t("description")}
        </p>
      </div>

      {purchaseStatus && !bannerDismissed && (
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5",
            purchaseStatus === "success"
              ? "border-emerald-500/20 bg-emerald-500/[0.06]"
              : "border-dash-border bg-dash-surface-alt"
          )}
        >
          <div className="flex items-center gap-2.5">
            {purchaseStatus === "success" ? (
              <Check className="h-4 w-4 shrink-0 text-emerald-400" strokeWidth={2.25} />
            ) : (
              <X className="h-4 w-4 shrink-0 text-dash-text-tertiary" strokeWidth={2.25} />
            )}
            <p
              className={cn(
                "text-sm",
                purchaseStatus === "success" ? "text-emerald-300" : "text-dash-text-secondary"
              )}
            >
              {purchaseStatus === "success" ? t("purchaseSuccess") : t("purchaseCancelled")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            className="text-dash-text-quaternary hover:text-dash-text"
            aria-label="close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-4 rounded-2xl border border-dash-border bg-dash-surface p-6">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-400">
          <BrainCircuit className="h-6 w-6" strokeWidth={2} />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-dash-text-tertiary">
            {t("balanceLabel")}
          </p>
          <p className="font-display text-3xl font-bold text-dash-text">
            {balance} <span className="text-lg font-semibold text-dash-text-tertiary">{t("balanceUnit", { count: balance })}</span>
          </p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-dash-text-tertiary">
          {t("packsTitle")}
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIT_PACK_ORDER.map((packId) => (
            <PackCard
              key={packId}
              packId={packId}
              highlight={packId === "standard" ? "popular" : packId === "power" ? "value" : undefined}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-dash-text-tertiary">
          {t("History.title")}
        </p>
        {transactions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-dash-border px-4 py-8 text-center text-sm text-dash-text-quaternary">
            {t("History.empty")}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
