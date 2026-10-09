import { X } from "lucide-react";
import type { SearchFilters } from "@shared";
import { sellerLabel } from "@/lib/labels";
import type { FilterChip, FilterKey } from "@/lib/searchState";

export function buildChips(applied: SearchFilters, aiKeys: readonly FilterKey[], categoryNames: Map<string, string>): FilterChip[] {
  const ai = new Set(aiKeys);
  const chips: FilterChip[] = [];
  for (const id of applied.categoryIds ?? []) {
    chips.push({ key: "categoryIds", value: id, label: categoryNames.get(id) ?? "Category", ai: ai.has("categoryIds") });
  }
  for (const value of applied.provinces ?? []) chips.push({ key: "provinces", value, label: value, ai: ai.has("provinces") });
  for (const value of applied.cities ?? []) chips.push({ key: "cities", value, label: value, ai: ai.has("cities") });
  for (const value of applied.sellerTypes ?? []) chips.push({ key: "sellerTypes", value, label: sellerLabel(value), ai: ai.has("sellerTypes") });
  for (const value of applied.oemModes ?? []) chips.push({ key: "oemModes", value, label: value, ai: ai.has("oemModes") });
  if (applied.minRating != null) chips.push({ key: "minRating", label: `Rating ${applied.minRating}+`, ai: ai.has("minRating") });
  if (applied.verifiedOnly) chips.push({ key: "verifiedOnly", label: "Verified factories", ai: ai.has("verifiedOnly") });
  if (applied.enrichedOnly) chips.push({ key: "enrichedOnly", label: "Has details", ai: ai.has("enrichedOnly") });
  if (applied.hasPrice) chips.push({ key: "hasPrice", label: "Has price", ai: ai.has("hasPrice") });
  return chips;
}

export function FilterChips({ chips, onRemove, onClear }: { chips: FilterChip[]; onRemove: (chip: FilterChip) => void; onClear: () => void }) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.value ?? chip.label}`}
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-white px-3 text-sm"
          onClick={() => onRemove(chip)}
        >
          {chip.ai ? <span className="rounded bg-primary/10 px-1 text-[10px] font-semibold uppercase tracking-wide text-primary">AI</span> : null}
          <span>{chip.label}</span>
          <span className="sr-only">Remove {chip.label} filter</span>
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      ))}
      <button type="button" className="min-h-11 px-2 text-sm font-medium text-primary underline" onClick={onClear}>
        Clear all
      </button>
    </div>
  );
}
