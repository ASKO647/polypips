"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export type CurrencyCode = "EUR" | "USD";

export const SUPPORTED_CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: "EUR", label: "EUR (€)" },
  { code: "USD", label: "USD ($)" },
];

type CurrencyContextValue = {
  currency: CurrencyCode;
  /** Persists to user_metadata.currency and only commits the UI switch
   * once that succeeds — reverts and rethrows on failure so callers can
   * surface the error instead of pretending the preference saved. */
  setCurrency: (next: CurrencyCode) => Promise<void>;
  /** Converts a EUR-denominated amount (the real, billed currency — Stripe
   * itself never charges in anything else) into the selected display
   * currency and formats it. */
  formatAmount: (amountEur: number, opts?: { signed?: boolean }) => string;
  ratesUnavailable: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  initialCurrency,
  children,
}: {
  initialCurrency: CurrencyCode;
  children: ReactNode;
}) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(initialCurrency);
  const [rates, setRates] = useState<Record<string, number>>({ EUR: 1 });
  const [ratesUnavailable, setRatesUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/fx-rates")
      .then((res) => res.json())
      .then((data: { rates?: Record<string, number>; error?: string }) => {
        if (cancelled) return;
        setRates(data.rates ?? { EUR: 1 });
        setRatesUnavailable(Boolean(data.error));
      })
      .catch((error) => {
        console.error("[currency] failed to load FX rates", error);
        if (!cancelled) setRatesUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = useCallback(
    async (next: CurrencyCode) => {
      const previous = currency;
      setCurrencyState(next);
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: { currency: next } });
      if (error) {
        setCurrencyState(previous);
        throw new Error(error.message);
      }
    },
    [currency]
  );

  const formatAmount = useCallback(
    (amountEur: number, opts?: { signed?: boolean }) => {
      const rate = currency === "EUR" ? 1 : (rates[currency] ?? null);
      // No real rate for a non-EUR currency (fetch failed or still loading)
      // — show EUR rather than silently mislabeling an unconverted amount
      // with the wrong currency symbol.
      const effectiveCurrency = rate === null ? "EUR" : currency;
      const converted = rate === null ? amountEur : amountEur * rate;
      return new Intl.NumberFormat(effectiveCurrency === "USD" ? "en-US" : "fr-FR", {
        style: "currency",
        currency: effectiveCurrency,
        maximumFractionDigits: Math.abs(converted) >= 100 ? 0 : 2,
        signDisplay: opts?.signed ? "exceptZero" : "auto",
      }).format(converted);
    },
    [currency, rates]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, ratesUnavailable }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
