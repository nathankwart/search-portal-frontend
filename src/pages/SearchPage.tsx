import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { cartSchema, searchResponseSchema, type ProductCard as ProductCardData, type SearchFilters } from "@shared";
import { SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/auth";
import { buildChips, FilterChips } from "@/components/FilterChips";
import { FilterPanel } from "@/components/FilterPanel";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton, usePageTitle } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { categoryListSchema, suggestSchema } from "@/lib/contracts";
import { sellerLabel } from "@/lib/labels";
import { keys } from "@/lib/keys";
import { getSessionId } from "@/lib/session";
import { isOemMode } from "@/lib/labels";
import {
  parseSearchParams,
  removeChip,
  searchPath,
  toSearchParams,
  toSearchRequest,
  valuesFor,
  type ArrayFilterKey,
  type FilterKey,
  type ParsedSearch,
} from "@/lib/searchState";
import { setActiveSearchEvent } from "@/lib/track";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { VerifiedMark } from "@/components/ContactBlock";

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const searchText = params.toString();
  const parsed = useMemo(() => parseSearchParams(new URLSearchParams(searchText)), [searchText]);
  const auth = useAuth();
  const desktop = useMediaQuery("(min-width: 768px)");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const request = useMemo(() => toSearchRequest(parsed, getSessionId()), [parsed]);
  usePageTitle(parsed.q ? parsed.q : "Search");

  const search = useQuery({
    queryKey: keys.search(request),
    queryFn: () => api.post("/search", request, searchResponseSchema),
    enabled: request.q.length > 0,
    placeholderData: keepPreviousData,
  });
  const cart = useQuery({
    queryKey: keys.cart,
    queryFn: () => api.get("/cart", cartSchema),
    enabled: Boolean(auth.session),
  });
  const identity = `${parsed.q}|${JSON.stringify(parsed.filters)}|${parsed.suppressed.join(",")}`;
  const [stacked, setStacked] = useState<{ identity: string; items: ProductCardData[] }>({ identity: "", items: [] });

  useEffect(() => {
    if (search.data?.searchEventId) setActiveSearchEvent(search.data.searchEventId);
  }, [search.data?.searchEventId]);

  useEffect(() => {
    const data = search.data;
    if (!data || data.query !== parsed.q) return;
    setStacked((current) => {
      if (current.identity !== identity || data.page <= 1) return { identity, items: data.products };
      const ids = new Set(current.items.map((item) => item.id));
      return { identity, items: [...current.items, ...data.products.filter((item) => !ids.has(item.id))] };
    });
  }, [identity, parsed.q, search.data]);

  const quantities = new Map<string, number>();
  for (const group of cart.data?.groups ?? []) {
    for (const item of group.items) quantities.set(item.productId, item.quantity);
  }

  function update(next: ParsedSearch) {
    setParams(toSearchParams(next));
  }

  const aiKeys = (search.data?.aiInferredFilters ?? []) as FilterKey[];
  const applied = search.data?.appliedFilters ?? parsed.filters;
  const names = new Map((search.data?.facets.categories ?? []).map((item) => [item.id, item.name]));
  const chips = search.data ? buildChips(applied, aiKeys, names) : [];
  const products = desktop ? (search.data?.products ?? []) : stacked.identity === identity ? stacked.items : (search.data?.products ?? []);

  function toggleValue(key: ArrayFilterKey, value: string, checked: boolean) {
    const current = new Set(valuesFor(applied, key));
    if (checked) current.add(value);
    else current.delete(value);
    const nextValues = [...current];
    const filters: SearchFilters = { ...parsed.filters };
    const suppressed = new Set(parsed.suppressed);
    if (nextValues.length === 0) {
      delete filters[key];
      if (aiKeys.includes(key)) suppressed.add(key);
    } else {
      if (key === "oemModes") filters.oemModes = nextValues.filter(isOemMode);
      else filters[key] = nextValues;
      suppressed.delete(key);
    }
    update({ ...parsed, page: 1, filters, suppressed: [...suppressed] });
  }

  function setFlag(key: "verifiedOnly" | "minRating", value: number | boolean | null) {
    const filters: SearchFilters = { ...parsed.filters };
    const suppressed = new Set(parsed.suppressed);
    if (key === "minRating") {
      if (typeof value === "number") {
        filters.minRating = value;
        suppressed.delete("minRating");
      } else {
        delete filters.minRating;
        if (aiKeys.includes("minRating")) suppressed.add("minRating");
      }
    } else if (value) {
      filters.verifiedOnly = true;
      suppressed.delete("verifiedOnly");
    } else {
      delete filters.verifiedOnly;
      if (aiKeys.includes("verifiedOnly")) suppressed.add("verifiedOnly");
    }
    update({ ...parsed, page: 1, filters, suppressed: [...suppressed] });
  }

  function setPriceDetails(checked: boolean) {
    const filters: SearchFilters = { ...parsed.filters };
    const suppressed = new Set(parsed.suppressed);
    if (checked) {
      filters.hasPrice = true;
      filters.enrichedOnly = true;
      suppressed.delete("hasPrice");
      suppressed.delete("enrichedOnly");
    } else {
      delete filters.hasPrice;
      delete filters.enrichedOnly;
      if (aiKeys.includes("hasPrice")) suppressed.add("hasPrice");
      if (aiKeys.includes("enrichedOnly")) suppressed.add("enrichedOnly");
    }
    update({ ...parsed, page: 1, filters, suppressed: [...suppressed] });
  }

  const total = search.data?.total ?? 0;
  const pageSize = search.data?.pageSize ?? 20;
  const page = search.data?.page ?? parsed.page;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const showCorrected = Boolean(search.data?.correctedQuery && search.data.correctedQuery.trim().toLowerCase() !== search.data.query.trim().toLowerCase());

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
        <Button type="button" variant="outline" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filters
        </Button>
      </div>
      <div className="md:grid md:grid-cols-[16rem_minmax(0,1fr)] md:gap-6">
        <aside className="hidden md:block">
          <div className="sticky top-24 rounded-lg border border-border bg-white p-4">
            <h2 className="mb-3 font-semibold">Filters</h2>
            {search.data ? (
              <FilterPanel
                facets={search.data.facets}
                applied={applied}
                onToggleValue={toggleValue}
                onMinRating={(value) => setFlag("minRating", value)}
                onVerified={(checked) => setFlag("verifiedOnly", checked)}
                onPriceDetails={setPriceDetails}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Filters appear with results.</p>
            )}
          </div>
        </aside>
        <div className="min-w-0">
          {!parsed.q ? <p>Type a product or supplier to search.</p> : null}
          {parsed.q && search.isLoading ? <ProductGridSkeleton /> : null}
          {parsed.q && search.isError ? (
            <div className="rounded-lg border border-border bg-white p-6" role="alert">
              <p className="font-medium">Search could not be completed.</p>
              <Button type="button" className="mt-4" variant="primary" onClick={() => void search.refetch()}>
                Retry
              </Button>
            </div>
          ) : null}
          {search.data && parsed.q ? (
            <div className="space-y-4">
              {search.data.notesForUser ? <p className="rounded-md bg-primary/5 px-3 py-2 text-sm text-primary">{search.data.notesForUser}</p> : null}
              {showCorrected ? (
                <p className="text-sm">
                  Showing results for <strong>{search.data.correctedQuery}</strong>
                </p>
              ) : null}
              <FilterChips
                chips={chips}
                onRemove={(chip) => update(removeChip(parsed, chip.key, chip.value, aiKeys))}
                onClear={() => update({ q: parsed.q, page: 1, filters: {}, suppressed: [] })}
              />
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <p>
                  {total} {total === 1 ? "product" : "products"}
                </p>
                {!search.data.aiUsed ? <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">Keyword search (AI unavailable)</span> : null}
              </div>
              {search.data.suppliers.length > 0 ? (
                <section aria-label="Matching suppliers">
                  <h2 className="text-sm font-semibold">Matching suppliers</h2>
                  <ul className="mt-2 flex gap-3 overflow-x-auto pb-2">
                    {search.data.suppliers.slice(0, 5).map((supplier) => (
                      <li key={supplier.id} className="min-w-[220px] max-w-xs shrink-0">
                        <Link to={`/suppliers/${supplier.id}`} state={{ searchEventId: search.data?.searchEventId }} className="block min-h-11 rounded-lg border border-border bg-white p-3">
                          <p className="font-medium break-words">{supplier.companyName}</p>
                          <p className="text-xs text-muted-foreground">{[supplier.city, supplier.province].filter(Boolean).join(", ")}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {supplier.sellerType ? <span className="text-xs">{sellerLabel(supplier.sellerType)}</span> : null}
                            <VerifiedMark verified={supplier.isVerifiedFactory} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {total === 0 ? (
                <EmptyResults query={parsed.q} />
              ) : (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((product, index) => (
                    <li key={product.id}>
                      <ProductCard
                        product={product}
                        position={desktop ? (page - 1) * pageSize + index + 1 : index + 1}
                        searchEventId={search.data?.searchEventId}
                        signedIn={Boolean(auth.session)}
                        cartQuantity={quantities.get(product.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {desktop && pages > 1 ? (
                <nav aria-label="Pagination" className="flex flex-wrap gap-2">
                  {pageList(page, pages).map((number) => (
                    <button
                      key={number}
                      type="button"
                      className={`min-h-11 min-w-11 rounded-md border border-border px-3 text-sm ${number === page ? "bg-primary text-primary-foreground" : "bg-white"}`}
                      aria-current={number === page ? "page" : undefined}
                      aria-label={`Page ${number}`}
                      onClick={() => update({ ...parsed, page: number })}
                    >
                      {number}
                    </button>
                  ))}
                </nav>
              ) : null}
              {!desktop && page * pageSize < total ? (
                <Button type="button" variant="outline" disabled={search.isFetching} onClick={() => update({ ...parsed, page: page + 1 })}>
                  {search.isFetching ? "Loading…" : "Load more"}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <Modal open={filtersOpen} onOpenChange={setFiltersOpen} title="Filters" description="Narrow the supplier results" sheet>
        {search.data ? (
          <FilterPanel
            facets={search.data.facets}
            applied={applied}
            onToggleValue={toggleValue}
            onMinRating={(value) => setFlag("minRating", value)}
            onVerified={(checked) => setFlag("verifiedOnly", checked)}
            onPriceDetails={setPriceDetails}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function pageList(current: number, totalPages: number): number[] {
  const end = Math.min(totalPages, Math.max(current, 3) + 2);
  const start = Math.max(1, end - 4);
  const pages: number[] = [];
  for (let number = start; number <= Math.min(totalPages, start + 4); number += 1) pages.push(number);
  return pages;
}

function EmptyResults({ query }: { query: string }) {
  const popular = useQuery({ queryKey: keys.popular, queryFn: () => api.get("/search/suggest", suggestSchema) });
  const categories = useQuery({ queryKey: keys.categories, queryFn: () => api.get("/categories", categoryListSchema) });
  const sorted = [...(categories.data ?? [])].sort((a, b) => b.productCount - a.productCount).slice(0, 6);
  return (
    <div className="rounded-lg border border-dashed border-border bg-white p-6">
      <p className="font-medium">No matches for &quot;{query}&quot;.</p>
      <p className="mt-2 text-sm text-muted-foreground">Try removing filters, or start from a category or a popular search.</p>
      {sorted.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {sorted.map((category) => (
            <li key={category.id}>
              <Link className="inline-flex min-h-11 items-center rounded-full border border-border px-3 text-sm" to={searchPath({ q: category.name, page: 1, filters: { categoryIds: [category.id] }, suppressed: [] })}>
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {(popular.data?.suggestions.length ?? 0) > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {popular.data?.suggestions.map((term) => (
            <li key={term}>
              <Link className="inline-flex min-h-11 items-center rounded-full bg-muted px-3 text-sm" to={searchPath({ q: term, page: 1, filters: {}, suppressed: [] })}>
                {term}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
