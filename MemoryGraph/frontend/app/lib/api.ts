/** Same-origin API base (proxied to backend via next.config rewrites). */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const ACCESS_TOKEN_KEY = "mg_access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  else sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = authHeaders(init.headers);
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });
}

export async function refreshAuthSession(): Promise<boolean> {
  const response = await fetch(`${API_URL}/auth/session`, { credentials: "include" });
  if (!response.ok) return false;
  const data = await response.json();
  if (data.access_token) setAccessToken(data.access_token);
  return Boolean(data.authenticated);
}
