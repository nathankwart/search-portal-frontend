import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { productCard, searchEventId } from "@/test/fixtures";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }));

function renderCard(product: ReturnType<typeof productCard>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ProductCard product={product} position={1} searchEventId={searchEventId} signedIn={false} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("product card", () => {
  it("shows a price range, currency, and MOQ when the product has a price", () => {
    renderCard(productCard());
    expect(screen.getByText(/CNY 12\.00/)).toBeInTheDocument();
    expect(screen.getByText(/MOQ 100 meter/)).toBeInTheDocument();
    expect(screen.getByText("Guangzhou Huazhimu Biotechnology")).toBeInTheDocument();
    expect(screen.getByText(/Matched 'PVC pipe'/)).toBeInTheDocument();
  });

  it("says price on inquiry when no price is stored", () => {
    renderCard(productCard({ name: "Display racks", priceMin: null, priceMax: null, moq: null, unit: null, isEnriched: false }));
    expect(screen.getByText("Price on inquiry")).toBeInTheDocument();
    expect(screen.queryByText(/MOQ/)).not.toBeInTheDocument();
  });
});
