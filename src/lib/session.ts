const KEY = "sourcing-session-id";

export function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return existing;
    const next = crypto.randomUUID();
    sessionStorage.setItem(KEY, next);
    return next;
  } catch {
    return "session-fallback";
  }
}
