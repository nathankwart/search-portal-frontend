import type { ProductCard } from "@shared";
import { formatPriceRange } from "@/lib/format";
import { useCurrency } from "@/lib/currency";

export function PriceText({
  priceMin,
  priceMax,
  currency,
  moq,
  unit,
}: {
  priceMin: number | null;
  priceMax: number | null;
  currency: ProductCard["currency"];
  moq?: number | null;
  unit?: string | null;
}) {
  const display = useCurrency();
  const stored = formatPriceRange(priceMin, priceMax, currency);
  if (!stored) {
    return <p className="text-sm font-medium">Price on inquiry</p>;
  }
  const code = currency || "CNY";
  const low = priceMin ?? priceMax;
  const high = priceMax ?? priceMin;
  const lowQuote = low == null ? null : display.quote(low, code);
  const highQuote = high == null ? null : display.quote(high, code);
  const converted =
    lowQuote?.approx && highQuote?.approx
        ? low === high
          ? lowQuote.text
          : `${lowQuote.text} – ${highQuote.text.replace(/^approx\. /, "")}`
      : null;
  return (
    <div>
      <p className="text-sm font-semibold" title="Supplier price in China, not a landed cost in Ghana.">
        {stored}
      </p>
      {converted && lowQuote ? (
        <p className="text-xs text-muted-foreground" title={lowQuote.title}>
          {converted}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Supplier price in China</p>
      )}
      {moq != null ? (
        <p className="mt-1 text-xs text-muted-foreground">
          MOQ {moq}
          {unit ? ` ${unit}` : ""}
        </p>
      ) : null}
    </div>
  );
}
