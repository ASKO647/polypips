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

/** Buckets ISO timestamps into `days` calendar-day counts (UTC, matching
 * sync-smart-money's own day-bucketing convention), oldest first, ending
 * today. Powers dashboard sparklines from real activity — an empty
 * `timestamps` array naturally produces an all-zero result, which renders
 * as a flat neutral line instead of a fabricated trend. */
export function bucketCountsByDay(timestamps: string[], days: number): number[] {
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const counts = new Map<string, number>();
  for (const ts of timestamps) {
    const key = dayKey(new Date(ts));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const result: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    result.push(counts.get(dayKey(d)) ?? 0);
  }
  return result;
}

/** Best-effort real first name from Supabase user_metadata — populated for
 * Google OAuth signups (given_name/full_name/name come from the provider's
 * own profile data), empty for plain email/password signups since the
 * signup form never collects a name. Returns null rather than guessing, so
 * callers can fall back to a name-less greeting instead of a placeholder. */
export function getFirstNameFromUser(
  user: { user_metadata?: Record<string, unknown> } | null | undefined
): string | null {
  const meta = user?.user_metadata;
  if (!meta) return null;

  const given = typeof meta.given_name === "string" ? meta.given_name.trim() : "";
  if (given) return given.split(/\s+/)[0];

  const full =
    typeof meta.full_name === "string"
      ? meta.full_name.trim()
      : typeof meta.name === "string"
        ? meta.name.trim()
        : "";
  if (full) return full.split(/\s+/)[0];

  return null;
}
