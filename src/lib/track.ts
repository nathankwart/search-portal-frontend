import type { InteractionEvent } from "@shared";
import { api, apiBaseUrl, getAccessToken } from "@/lib/api";
import { getSessionId } from "@/lib/session";

type TrackInput = Omit<InteractionEvent, "sessionId">;

const queue: InteractionEvent[] = [];
let timer: number | null = null;
let flushing = false;
let activeSearchEventId: string | null = null;

export function setActiveSearchEvent(id: string | null) {
  activeSearchEventId = id;
}

export function activeSearchEvent() {
  return activeSearchEventId;
}

function schedule() {
  if (timer != null) return;
  timer = window.setTimeout(() => {
    timer = null;
    void flush();
  }, 5000);
}

export function track(event: TrackInput) {
  try {
    const payload: InteractionEvent = { ...event, sessionId: getSessionId() };
    if (!payload.searchEventId && activeSearchEventId && event.eventType !== "inquiry_submit") {
      payload.searchEventId = activeSearchEventId;
    }
    queue.push(payload);
    if (queue.length >= 20) void flush();
    else schedule();
  } catch {
    // Tracking must never break the page.
  }
}

export async function flush() {
  try {
    if (timer != null) {
      window.clearTimeout(timer);
      timer = null;
    }
    if (queue.length === 0 || flushing) return;
    const batch = queue.splice(0, 50);
    flushing = true;
    try {
      await api.post("/events", { events: batch }, undefined, { silent: true, redirectOn401: false });
    } catch {
      // Drop the batch. A failed beacon must not block sourcing.
    } finally {
      flushing = false;
      if (queue.length >= 20) void flush();
      else if (queue.length > 0) schedule();
    }
  } catch {
    flushing = false;
  }
}

export function flushOnHide() {
  let payload = "";
  try {
    if (timer != null) {
      window.clearTimeout(timer);
      timer = null;
    }
    if (queue.length === 0) return;
    const batch = queue.splice(0, 50);
    payload = JSON.stringify({ events: batch });
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    void fetch(`${apiBaseUrl()}/events`, { method: "POST", headers, body: payload, keepalive: true });
  } catch {
    try {
      if (!payload) return;
      navigator.sendBeacon?.(`${apiBaseUrl()}/events`, new Blob([payload], { type: "application/json" }));
    } catch {
      // Ignore.
    }
  }
}

export function resetTrackerForTests() {
  queue.length = 0;
  if (timer != null) {
    window.clearTimeout(timer);
    timer = null;
  }
  flushing = false;
  activeSearchEventId = null;
}

export function pendingCount() {
  return queue.length;
}
