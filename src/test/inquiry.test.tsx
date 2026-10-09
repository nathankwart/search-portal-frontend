import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ApiClientError, api } from "@/lib/api";
import { SubmitInquiry } from "@/pages/CartPage";
import { inquiryFixture } from "@/test/fixtures";

const post = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: { post, get: vi.fn(), patch: vi.fn(), delete: vi.fn(), download: vi.fn() },
  ApiClientError: class ApiClientError extends Error {
    status: number;
    code: string;
    constructor(message: string, status = 400, code = "VALIDATION_ERROR") {
      super(message);
      this.name = "ApiClientError";
      this.status = status;
      this.code = code;
    }
  },
}));

vi.mock("@/lib/track", () => ({ track: vi.fn(), setActiveSearchEvent: vi.fn(), flushOnHide: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }));

function renderForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SubmitInquiry />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("submit inquiry", () => {
  beforeEach(() => {
    post.mockReset();
  });

  it("shows the inquiry reference after a successful submit", async () => {
    const user = userEvent.setup();
    post.mockResolvedValue(inquiryFixture);
    renderForm();
    await user.click(screen.getByRole("button", { name: "Submit inquiry" }));
    expect(await screen.findByText(/INQ-2026-000001/)).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/inquiries", expect.objectContaining({ destination: "Tema, Ghana" }), expect.anything(), expect.anything());
  });

  it("shows the empty-list error from the API", async () => {
    const user = userEvent.setup();
    post.mockRejectedValue(new ApiClientError("Your sourcing list is empty", 400, "VALIDATION_ERROR"));
    renderForm();
    await user.click(screen.getByRole("button", { name: "Submit inquiry" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Your sourcing list is empty");
  });
});
