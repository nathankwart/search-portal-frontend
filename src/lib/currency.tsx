import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { publicSettingsSchema, type PublicSettings } from "@shared";
import { api } from "@/lib/api";
import { formatMoneyAmount, formatWhen } from "@/lib/format";
import { keys } from "@/lib/keys";

export type DisplayCurrency = "CNY" | "USD" | "GHS";

type Rates = PublicSettings["exchangeRates"];

type CurrencyValue = {
  currency: DisplayCurrency;
  setCurrency: (currency: DisplayCurrency) => void;
  rates: Rates;
  options: DisplayCurrency[];
  quote: (amount: number, source: DisplayCurrency | null) => { text: string; approx: boolean; title: string } | null;
};

const STORAGE_KEY = "sourcing-display-currency";

const fallbackRates: Rates = { base: "CNY", USD: null, GHS: null, updatedAt: null };

const defaultValue: CurrencyValue = {
  currency: "CNY",
  setCurrency: () => undefined,
  rates: fallbackRates,
  options: ["CNY"],
  quote: (amount, source) => {
    const code = source || "CNY";
    return { text: formatMoneyAmount(amount, code), approx: false, title: "Supplier price in China, not a landed cost in Ghana." };
  },
};

const CurrencyContext = createContext<CurrencyValue>(defaultValue);

function readStored(): DisplayCurrency {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "USD" || value === "GHS" || value === "CNY") return value;
  } catch {
    // Ignore storage failures.
  }
  return "CNY";
}

export function toCny(amount: number, source: DisplayCurrency, rates: Rates): number | null {
  if (source === "CNY") return amount;
  const rate = rates[source];
  if (!rate) return null;
  return amount / rate;
}

export function fromCny(amount: number, target: DisplayCurrency, rates: Rates): number | null {
  if (target === "CNY") return amount;
  const rate = rates[target];
  if (!rate) return null;
  return amount * rate;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const settings = useQuery({
    queryKey: keys.publicSettings,
    queryFn: () => api.get("/settings/public", publicSettingsSchema),
    staleTime: 60_000,
  });
  const rates = settings.data?.exchangeRates ?? fallbackRates;
  const options = useMemo<DisplayCurrency[]>(() => {
    const list: DisplayCurrency[] = ["CNY"];
    if (rates.USD) list.push("USD");
    if (rates.GHS) list.push("GHS");
    return list;
  }, [rates.USD, rates.GHS]);
  const [currency, setCurrencyState] = useState<DisplayCurrency>(readStored);

  useEffect(() => {
    if (!options.includes(currency)) setCurrencyState("CNY");
  }, [currency, options]);

  const value = useMemo<CurrencyValue>(() => {
    return {
      currency,
      options,
      rates,
      setCurrency: (next) => {
        setCurrencyState(next);
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // Ignore storage failures.
        }
      },
      quote: (amount, source) => {
        const code = source || "CNY";
        const title = "Supplier price in China, not a landed cost in Ghana.";
        if (currency === code) return { text: formatMoneyAmount(amount, code), approx: false, title };
        const cny = toCny(amount, code, rates);
        const converted = cny == null ? null : fromCny(cny, currency, rates);
        if (converted == null) return { text: formatMoneyAmount(amount, code), approx: false, title };
        const rate = currency === "CNY" ? null : rates[currency];
        const rateText = rate == null ? "" : ` CNY to ${currency} rate ${rate}.`;
        const when = rates.updatedAt ? ` Rate date ${formatWhen(rates.updatedAt)}.` : "";
        return {
          text: `approx. ${formatMoneyAmount(converted, currency)}`,
          approx: true,
          title: `${title}${rateText}${when}`,
        };
      },
    };
  }, [currency, options, rates]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
