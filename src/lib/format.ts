export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits }).format(value);
}

export function formatMoneyAmount(value: number, currency: string): string {
  const amount = new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  return `${currency} ${amount}`;
}

export function formatPriceRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string | null | undefined,
): string | null {
  if (min == null && max == null) return null;
  const code = currency || "CNY";
  if (min != null && max != null && min !== max) return `${formatMoneyAmount(min, code)} – ${formatMoneyAmount(max, code).replace(`${code} `, "")}`;
  const single = min ?? max;
  return single == null ? null : formatMoneyAmount(single, code);
}

export function formatWhen(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export function yearsLabel(years: number | null | undefined): string | null {
  if (years == null) return null;
  return years === 1 ? "1 year on platform" : `${formatNumber(years, 0)} years on platform`;
}

export function starsLabel(value: number | null | undefined): string | null {
  if (value == null) return null;
  return `${formatNumber(value, 1)} stars`;
}

export function repeatLabel(value: number | null | undefined): string | null {
  if (value == null) return null;
  return `${formatNumber(value, 1)}% repeat buyers`;
}

export function percentLabel(value: number | null | undefined): string | null {
  if (value == null) return null;
  return `${formatNumber(value, 1)}%`;
}

export function areaLabel(value: number | null | undefined): string | null {
  if (value == null) return null;
  return `${formatNumber(value, 0)} m²`;
}
