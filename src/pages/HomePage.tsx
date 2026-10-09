import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { SearchBox } from "@/components/SearchBox";
import { QueryState, usePageTitle } from "@/components/feedback";
import { api } from "@/lib/api";
import { categoryListSchema, suggestSchema } from "@/lib/contracts";
import { keys } from "@/lib/keys";
import { searchPath } from "@/lib/searchState";

export function HomePage() {
  const navigate = useNavigate();
  usePageTitle("Find suppliers");
  const popular = useQuery({
    queryKey: keys.popular,
    queryFn: () => api.get("/search/suggest", suggestSchema),
  });
  const categories = useQuery({
    queryKey: keys.categories,
    queryFn: () => api.get("/categories", categoryListSchema),
  });
  const sorted = [...(categories.data ?? [])].sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-3xl py-6 sm:py-12">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">For buyers in Ghana</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Find products and the Chinese factories that make them</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Describe what you need in plain English. Prices are supplier prices in China, not landed costs in Ghana.
      </p>
      <div className="mt-6">
        <SearchBox size="hero" rotatePlaceholder onSearch={(query) => navigate(searchPath({ q: query, page: 1, filters: {}, suppressed: [] }))} />
      </div>
      <section className="mt-8 text-left" aria-label="Popular searches">
        <h2 className="text-sm font-semibold">Popular searches</h2>
        <QueryState
          isLoading={popular.isLoading}
          isError={popular.isError}
          onRetry={() => void popular.refetch()}
          isEmpty={(popular.data?.suggestions.length ?? 0) === 0}
          emptyTitle="Popular searches will appear after people start searching."
        >
          <ul className="mt-3 flex flex-wrap gap-2">
            {popular.data?.suggestions.map((term) => (
              <li key={term}>
                <button
                  type="button"
                  className="min-h-11 rounded-full border border-border bg-white px-4 text-sm"
                  onClick={() => navigate(searchPath({ q: term, page: 1, filters: {}, suppressed: [] }))}
                >
                  {term}
                </button>
              </li>
            ))}
          </ul>
        </QueryState>
      </section>
      <section className="mt-8 text-left" aria-label="Categories">
        <h2 className="text-sm font-semibold">Categories</h2>
        <QueryState isLoading={categories.isLoading} isError={categories.isError} onRetry={() => void categories.refetch()} isEmpty={sorted.length === 0} emptyTitle="No categories yet.">
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {sorted.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 text-left text-sm"
                  onClick={() => navigate(searchPath({ q: category.name, page: 1, filters: { categoryIds: [category.id] }, suppressed: [] }))}
                >
                  <span className="break-words">{category.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{category.productCount}</span>
                </button>
              </li>
            ))}
          </ul>
        </QueryState>
      </section>
    </div>
  );
}
