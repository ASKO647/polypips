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
