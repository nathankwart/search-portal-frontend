import type { SearchFilters, SearchRequest } from "@shared";
import { isOemMode } from "@/lib/labels";

const ARRAY_KEYS = ["categoryIds", "provinces", "cities", "sellerTypes", "oemModes"] as const;
const FLAG_KEYS = ["verifiedOnly", "enrichedOnly", "hasPrice"] as const;
const FILTER_KEYS = [...ARRAY_KEYS, ...FLAG_KEYS, "minRating"] as const;

export type FilterKey = (typeof FILTER_KEYS)[number];
export type ArrayFilterKey = (typeof ARRAY_KEYS)[number];

export type ParsedSearch = {
  q: string;
  page: number;
  filters: SearchFilters;
  suppressed: FilterKey[];
};

export type FilterChip = {
  key: FilterKey;
  value?: string;
  label: string;
  ai: boolean;
};

function isFilterKey(value: string): value is FilterKey {
  return (FILTER_KEYS as readonly string[]).includes(value);
}

export function parseSearchParams(params: URLSearchParams): ParsedSearch {
  const filters: SearchFilters = {};
  const categoryIds = params.getAll("categoryIds").map((value) => value.trim()).filter(Boolean);
  const provinces = params.getAll("provinces").map((value) => value.trim()).filter(Boolean);
  const cities = params.getAll("cities").map((value) => value.trim()).filter(Boolean);
  const sellerTypes = params.getAll("sellerTypes").map((value) => value.trim()).filter(Boolean);
  const oemModes = params.getAll("oemModes").map((value) => value.trim()).filter(isOemMode);
  if (categoryIds.length) filters.categoryIds = categoryIds;
  if (provinces.length) filters.provinces = provinces;
  if (cities.length) filters.cities = cities;
  if (sellerTypes.length) filters.sellerTypes = sellerTypes;
  if (oemModes.length) filters.oemModes = oemModes;
  const rating = Number(params.get("minRating"));
  if (params.get("minRating") && Number.isFinite(rating)) filters.minRating = rating;
  if (params.get("verifiedOnly") === "1") filters.verifiedOnly = true;
  if (params.get("enrichedOnly") === "1") filters.enrichedOnly = true;
  if (params.get("hasPrice") === "1") filters.hasPrice = true;
  const page = Number(params.get("page"));
  const suppressed = params.getAll("suppress").filter(isFilterKey);
  return {
    q: (params.get("q") ?? "").trim().slice(0, 300),
    page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
    filters,
    suppressed: [...new Set(suppressed)],
  };
}

export function toSearchParams(state: ParsedSearch): URLSearchParams {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.page > 1) params.set("page", String(state.page));
  for (const key of ARRAY_KEYS) {
    for (const value of state.filters[key] ?? []) params.append(key, value);
  }
  if (state.filters.minRating != null) params.set("minRating", String(state.filters.minRating));
  for (const key of FLAG_KEYS) {
    if (state.filters[key]) params.set(key, "1");
  }
  for (const key of state.suppressed) params.append("suppress", key);
  return params;
}

export function searchPath(state: ParsedSearch): string {
  const text = toSearchParams(state).toString();
  return text ? `/search?${text}` : "/search";
}

export function toSearchRequest(state: ParsedSearch, sessionId: string): SearchRequest {
  const request: SearchRequest = {
    q: state.q,
    page: state.page,
    pageSize: 20,
    sessionId,
  };
  const filters = cleanFilters(state.filters);
  if (filters) request.filters = filters;
  if (state.suppressed.length) request.suppressedFilters = state.suppressed;
  return request;
}

function cleanFilters(filters: SearchFilters): SearchFilters | undefined {
  const next: SearchFilters = {};
  if (filters.categoryIds?.length) next.categoryIds = filters.categoryIds;
  if (filters.provinces?.length) next.provinces = filters.provinces;
  if (filters.cities?.length) next.cities = filters.cities;
  if (filters.sellerTypes?.length) next.sellerTypes = filters.sellerTypes;
  if (filters.oemModes?.length) next.oemModes = filters.oemModes;
  if (filters.minRating != null) next.minRating = filters.minRating;
  if (filters.verifiedOnly) next.verifiedOnly = true;
  if (filters.enrichedOnly) next.enrichedOnly = true;
  if (filters.hasPrice) next.hasPrice = true;
  return Object.keys(next).length ? next : undefined;
}

export function removeChip(current: ParsedSearch, key: FilterKey, value: string | undefined, aiKeys: readonly FilterKey[]): ParsedSearch {
  const filters: SearchFilters = { ...current.filters };
  if (key === "oemModes") {
    const list = (filters.oemModes ?? []).filter((item) => item !== value);
    if (list.length) filters.oemModes = list;
    else delete filters.oemModes;
  } else if (key === "categoryIds" || key === "provinces" || key === "cities" || key === "sellerTypes") {
    const list = (filters[key] ?? []).filter((item) => item !== value);
    if (list.length) filters[key] = list;
    else delete filters[key];
  } else {
    delete filters[key];
  }
  const suppressed = new Set(current.suppressed);
  if (aiKeys.includes(key)) suppressed.add(key);
  return { q: current.q, page: 1, filters, suppressed: [...suppressed] };
}

export function valuesFor(filters: SearchFilters, key: ArrayFilterKey): string[] {
  return [...(filters[key] ?? [])];
}
