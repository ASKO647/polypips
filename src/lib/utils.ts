import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const EUR_FORMATTER = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

export function formatEUR(value: number) {
  return `${EUR_FORMATTER.format(value)} €`;
}

export function formatSignedEUR(value: number) {
  return `${value >= 0 ? "+" : ""}${formatEUR(value)}`;
}

const RESET_DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
});

/** Formats a subscription's current_period_end for the quota-lock reset
 * messages ("le 14 septembre"), so the date shown always matches the
 * user's real Stripe renewal instead of an arbitrary calendar month. */
export function formatResetDate(periodEnd: string) {
  return RESET_DATE_FORMATTER.format(new Date(periodEnd));
}
