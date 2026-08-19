export type OwnerPeriod = "today" | "7d" | "30d" | "3m" | "6m" | "12m" | "all";

export const OWNER_PERIODS: { value: OwnerPeriod; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "3m", label: "3 mois" },
  { value: "6m", label: "6 mois" },
  { value: "12m", label: "12 mois" },
  { value: "all", label: "Tout" },
];

export function parseOwnerPeriod(value: string | undefined): OwnerPeriod {
  return OWNER_PERIODS.some((p) => p.value === value) ? (value as OwnerPeriod) : "30d";
}

/** Resolves a period selector value to a `since` cutoff — null for "all"
 * (no lower bound), consumed by every owner-data fetch function that takes
 * a `since: Date | null` parameter. */
export function ownerPeriodSince(period: OwnerPeriod): Date | null {
  const now = Date.now();
  const days = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000);
  switch (period) {
    case "today": {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
    case "7d":
      return days(7);
    case "30d":
      return days(30);
    case "3m":
      return days(90);
    case "6m":
      return days(180);
    case "12m":
      return days(365);
    case "all":
      return null;
  }
}
