import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { SearchPage } from "@/pages/SearchPage";
import { searchFixture } from "@/test/fixtures";

const post = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: {
    post,
    get: vi.fn().mockResolvedValue({ suggestions: [], data: [] }),
    patch: vi.fn(),
    delete: vi.fn(),
    download: vi.fn(),
  },
  ApiClientError: class ApiClientError extends Error {},
  setAccessToken: vi.fn(),
  setApiHandlers: vi.fn(),
  getAccessToken: () => null,
  apiBaseUrl: () => "http://localhost:4000/api/v1",
}));

vi.mock("@/auth", () => ({
  useAuth: () => ({
    loading: false,
    session: null,
    profile: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }));

describe("filter chips", () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue(searchFixture);
  });

  it("re-runs search with an AI filter suppressed when that chip is removed", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/search?q=perfume"]}>
          <SearchPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Showing perfume makers in Guangdong that accept OEM.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Remove Guangdong filter/i }));

    await waitFor(() => {
      const bodies = post.mock.calls.map((call) => call[1] as { suppressedFilters?: string[]; filters?: { provinces?: string[] } });
      const suppressed = bodies.find((body) => body.suppressedFilters?.includes("provinces"));
      expect(suppressed).toBeTruthy();
      expect(suppressed?.filters?.provinces).toBeUndefined();
    });
  });
});
