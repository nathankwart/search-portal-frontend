import type { SearchFilters, SearchResponse } from "@shared";
import { OEM_MODES, sellerLabel } from "@/lib/labels";
import type { ArrayFilterKey } from "@/lib/searchState";

const RATINGS = [3, 3.5, 4, 4.5, 5];

export function FilterPanel({
  facets,
  applied,
  onToggleValue,
  onMinRating,
  onVerified,
  onPriceDetails,
}: {
  facets: SearchResponse["facets"];
  applied: SearchFilters;
  onToggleValue: (key: ArrayFilterKey, value: string, checked: boolean) => void;
  onMinRating: (value: number | null) => void;
  onVerified: (checked: boolean) => void;
  onPriceDetails: (checked: boolean) => void;
}) {
  return (
    <div className="space-y-5 text-sm">
      <CheckGroup title="Category" options={facets.categories.map((item) => ({ value: item.id, label: `${item.name} (${item.count})` }))} selected={applied.categoryIds ?? []} onToggle={(value, checked) => onToggleValue("categoryIds", value, checked)} />
      <CheckGroup title="Province" options={facets.provinces.map((item) => ({ value: item.value, label: `${item.value} (${item.count})` }))} selected={applied.provinces ?? []} onToggle={(value, checked) => onToggleValue("provinces", value, checked)} />
      <CheckGroup title="Seller type" options={facets.sellerTypes.map((item) => ({ value: item.value, label: `${sellerLabel(item.value)} (${item.count})` }))} selected={applied.sellerTypes ?? []} onToggle={(value, checked) => onToggleValue("sellerTypes", value, checked)} />
      <CheckGroup title="OEM mode" options={OEM_MODES.map((mode) => ({ value: mode, label: mode }))} selected={applied.oemModes ?? []} onToggle={(value, checked) => onToggleValue("oemModes", value, checked)} />
      <div>
        <label htmlFor="min-rating" className="font-medium">
          Minimum supplier rating
        </label>
        <select
          id="min-rating"
          className="mt-2 min-h-11 w-full rounded-md border border-border bg-white px-3"
          value={applied.minRating ?? ""}
          onChange={(event) => onMinRating(event.target.value ? Number(event.target.value) : null)}
        >
          <option value="">Any</option>
          {RATINGS.map((rating) => (
            <option key={rating} value={rating}>
              {rating}+
            </option>
          ))}
        </select>
      </div>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" className="h-4 w-4" checked={Boolean(applied.verifiedOnly)} onChange={(event) => onVerified(event.target.checked)} />
        Verified factories only
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={Boolean(applied.hasPrice || applied.enrichedOnly)}
          onChange={(event) => onPriceDetails(event.target.checked)}
        />
        Has price / details only
      </label>
    </div>
  );
}

function CheckGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string, checked: boolean) => void;
}) {
  if (options.length === 0) return null;
  const chosen = new Set(selected);
  return (
    <fieldset>
      <legend className="font-medium">{title}</legend>
      <div className="mt-2 max-h-48 space-y-1 overflow-auto pr-1">
        {options.map((option) => (
          <label key={option.value} className="flex min-h-11 items-center gap-2">
            <input type="checkbox" className="h-4 w-4" checked={chosen.has(option.value)} onChange={(event) => onToggle(option.value, event.target.checked)} />
            <span className="break-words">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
