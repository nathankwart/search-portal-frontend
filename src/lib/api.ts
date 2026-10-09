import { apiErrorSchema } from "@shared";
import type { ZodType } from "zod";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type QueryValue = string | number | boolean | null | undefined;

type RequestOptions = {
  silent?: boolean;
  redirectOn401?: boolean;
};

const handlers: { onUnauthorized: () => void } = {
  onUnauthorized: () => {
    if (!window.location.pathname.startsWith("/login")) window.location.assign("/login");
  },
};

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setApiHandlers(next: { onUnauthorized: () => void }) {
  handlers.onUnauthorized = next.onUnauthorized;
}

export function apiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");
}

function parseBody<T>(schema: ZodType<T> | undefined, data: unknown, label: string): T {
  if (!schema) return data as T;
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiClientError(`${label} did not match the expected format`, 500, "INTERNAL");
  }
  return result.data;
}

function fail(status: number, body: unknown, options?: RequestOptions): never {
  const parsed = apiErrorSchema.safeParse(body);
  const message = parsed.success ? parsed.data.error.message : "Request failed";
  const code = parsed.success ? parsed.data.error.code : "INTERNAL";
  if (status === 401 && options?.redirectOn401 !== false) handlers.onUnauthorized();
  else if (!options?.silent && status !== 401) toast.error(message);
  throw new ApiClientError(message, status, code, parsed.success ? parsed.data.error.details : undefined);
}

async function authHeader(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? null;
  setAccessToken(token);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function withQuery(path: string, query?: Record<string, QueryValue>): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}

async function request<T>(path: string, init: RequestInit, schema?: ZodType<T>, options?: RequestOptions): Promise<T> {
  try {
    const headers = new Headers(init.headers);
    const auth = await authHeader();
    for (const [key, value] of Object.entries(auth)) headers.set(key, value);
    if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const response = await fetch(`${apiBaseUrl()}${path}`, { ...init, headers });
    if (response.status === 204) return parseBody(schema, null, path);
    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        throw new ApiClientError("Response was not JSON", response.status, "INTERNAL");
      }
    }
    if (!response.ok) fail(response.status, body, options);
    return parseBody(schema, body, path);
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    if (!options?.silent) toast.error("Network error");
    throw new ApiClientError("Network error", 0, "INTERNAL");
  }
}

export const api = {
  get<T>(path: string, schema: ZodType<T>, query?: Record<string, QueryValue>, options?: RequestOptions) {
    return request(withQuery(path, query), { method: "GET" }, schema, options);
  },
  post<T>(path: string, body: unknown, schema?: ZodType<T>, options?: RequestOptions) {
    return request(path, { method: "POST", body: JSON.stringify(body ?? {}) }, schema, options);
  },
  patch<T>(path: string, body: unknown, schema?: ZodType<T>, options?: RequestOptions) {
    return request(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }, schema, options);
  },
  delete<T>(path: string, schema?: ZodType<T>, options?: RequestOptions) {
    return request(path, { method: "DELETE" }, schema, options);
  },
  async download(path: string, filename: string) {
    const headers = await authHeader();
    const response = await fetch(`${apiBaseUrl()}${path}`, { headers });
    if (!response.ok) {
      const text = await response.text();
      let body: unknown = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = null;
      }
      fail(response.status, body);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  },
};
