import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { api } from "@/lib/api";
import { productCard, productId, searchEventId } from "@/test/fixtures";

const post = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: { post, get: vi.fn(), patch: vi.fn(), delete: vi.fn(), download: vi.fn() },
  ApiClientError: class ApiClientError extends Error {},
}));

vi.mock("@/lib/track", () => ({ track: vi.fn(), setActiveSearchEvent: vi.fn(), flushOnHide: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }));

function renderCard(signedIn: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/search?q=pvc+pipes"]}>
        <Routes>
          <Route path="/search" element={<ProductCard product={productCard()} position={1} searchEventId={searchEventId} signedIn={signedIn} />} />
          <Route path="/login" element={<h1>Sign in</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("add to sourcing list", () => {
  beforeEach(() => {
    post.mockReset();
  });

  it("sends a signed-out buyer to sign in", async () => {
    const user = userEvent.setup();
    renderCard(false);
    await user.click(screen.getByRole("button", { name: "Add to sourcing list" }));
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("adds a quantity for a signed-in buyer", async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ groups: [], itemCount: 1, supplierCount: 1 });
    renderCard(true);
    await user.click(screen.getByRole("button", { name: "Add to sourcing list" }));
    await user.clear(screen.getByLabelText("Quantity"));
    await user.type(screen.getByLabelText("Quantity"), "3");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(api.post).toHaveBeenCalledWith("/cart/items", expect.objectContaining({ productId, quantity: 3 }), expect.anything(), expect.anything());
  });
});
