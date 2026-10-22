import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronRight, LayoutGrid } from "lucide-react";
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
    <div className="mx-auto max-w-3xl space-y-8 pb-4 pt-2 sm:pt-6">
      <section className="rounded-3xl border border-border bg-card px-5 py-6 shadow-sm sm:px-8 sm:py-8">
        <p className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">For buyers in Ghana</p>
        <h1 className="mt-4 max-w-xl text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-4xl">Find products and the Chinese factories that make them</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          Describe what you need in plain English. Prices are supplier prices in China, not landed costs in Ghana.
        </p>
        <div className="mt-6">
          <SearchBox size="hero" rotatePlaceholder onSearch={(query) => navigate(searchPath({ q: query, page: 1, filters: {}, suppressed: [] }))} />
        </div>
      </section>
      <section aria-label="Popular searches">
        <h2 className="text-base font-semibold tracking-tight">Popular searches</h2>
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
                  className="inline-flex min-h-10 items-center rounded-full bg-muted px-4 text-sm font-medium text-foreground transition hover:bg-primary/10 hover:text-primary"
                  onClick={() => navigate(searchPath({ q: term, page: 1, filters: {}, suppressed: [] }))}
                >
                  {term}
                </button>
              </li>
            ))}
          </ul>
        </QueryState>
      </section>
      <section aria-label="Categories">
        <h2 className="text-base font-semibold tracking-tight">Categories</h2>
        <QueryState isLoading={categories.isLoading} isError={categories.isError} onRetry={() => void categories.refetch()} isEmpty={sorted.length === 0} emptyTitle="No categories yet.">
          <ul className="mt-3 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
            {sorted.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 text-left shadow-sm transition hover:border-primary/30 hover:bg-muted/70"
                  onClick={() => navigate(searchPath({ q: category.name, page: 1, filters: { categoryIds: [category.id] }, suppressed: [] }))}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-medium">{category.name}</span>
                    {category.productCount > 0 ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {category.productCount === 1 ? "1 product" : `${category.productCount} products`}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </QueryState>
      </section>
    </div>
  );
}
