const EUR_2DP = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PERCENT_1DP = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const DATETIME = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatOwnerEur(value: number) {
  return EUR_2DP.format(value);
}

export function formatOwnerPercent(value: number | null) {
  return value === null ? "—" : `${PERCENT_1DP.format(value)} %`;
}

export function formatOwnerDateTime(iso: string | null) {
  return iso ? DATETIME.format(new Date(iso)) : "—";
}
