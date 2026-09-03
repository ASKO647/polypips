"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

export function CancelSubscriptionModal({
  open,
  onClose,
  onConfirm,
  confirming = false,
  renewalDate,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirming?: boolean;
  renewalDate: string;
}) {
  const t = useTranslations("Profile.CancelSubscriptionModal");
  if (!open) return null;

  const period = renewalDate ? t("bodyPeriod", { date: renewalDate }) : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-dash-overlay"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md animate-fade-up rounded-2xl border border-dash-border bg-dash-bg p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-dash-text">
            {t("title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeAria")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dash-border text-dash-text-secondary transition-colors hover:text-dash-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-dash-text-secondary">
          {t("body", { period })}
        </p>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            className="flex h-11 items-center justify-center rounded-full border border-dash-border-strong text-sm font-semibold text-dash-text-secondary transition-colors hover:border-dash-text-quaternary hover:text-dash-text disabled:pointer-events-none disabled:opacity-50 sm:flex-1"
          >
            {t("back")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="flex h-11 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-60 sm:flex-1"
          >
            {confirming ? t("confirming") : t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
