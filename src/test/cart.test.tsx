import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CartPage } from "@/pages/CartPage";
import { api } from "@/lib/api";
import { cartFixture } from "@/test/fixtures";

const get = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: { get, post: vi.fn(), patch: vi.fn(), delete: vi.fn(), download: vi.fn() },
  ApiClientError: class ApiClientError extends Error {},
}));

vi.mock("@/lib/track", () => ({ track: vi.fn(), setActiveSearchEvent: vi.fn(), flushOnHide: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }));

describe("sourcing list", () => {
  it("groups products under their suppliers", async () => {
    get.mockResolvedValue(cartFixture);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole("heading", { name: "Guangzhou Huazhimu Biotechnology" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Yiwu Display Co" })).toBeInTheDocument();
    expect(screen.getByText("Floral perfume")).toBeInTheDocument();
    expect(screen.getByText("Perfume bottle")).toBeInTheDocument();
    expect(screen.getByText("Supermarket display racks")).toBeInTheDocument();
    expect(screen.getByText("2 suppliers")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/cart", expect.anything());
  });
});
