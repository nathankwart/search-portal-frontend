import { track, flushOnHide, resetTrackerForTests } from "@/lib/track";
import { api } from "@/lib/api";
import { productId, supplierAId } from "@/test/fixtures";

const post = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: { post },
  apiBaseUrl: () => "http://localhost:4000/api/v1",
  getAccessToken: () => "token",
}));

describe("event queue", () => {
  beforeEach(() => {
    resetTrackerForTests();
    post.mockReset();
    post.mockResolvedValue({ accepted: 1 });
  });

  afterEach(() => {
    resetTrackerForTests();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("flushes when 20 events are queued", async () => {
    for (let index = 0; index < 20; index += 1) {
      track({ eventType: "product_view", productId });
    }
    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const body = post.mock.calls[0]?.[1] as { events: unknown[] };
    expect(body.events).toHaveLength(20);
    expect(api.post).toHaveBeenCalledWith("/events", expect.anything(), undefined, { silent: true, redirectOn401: false });
  });

  it("flushes a short queue after 5 seconds", async () => {
    vi.useFakeTimers();
    track({ eventType: "supplier_view", supplierId: supplierAId });
    expect(post).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5000);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("sends queued events with fetch keepalive when the page hides", () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    track({ eventType: "cart_add", productId });
    flushOnHide();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.keepalive).toBe(true);
    expect(init.method).toBe("POST");
  });
});
