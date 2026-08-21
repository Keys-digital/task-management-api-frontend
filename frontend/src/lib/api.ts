/**
 * Centralized API client for TaskFlo with silent JWT token refresh.
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

let isRefreshingPromise: Promise<string | null> | null = null;

/**
 * Attempt silent refresh of access token using refresh_token from localStorage.
 * Deduplicates concurrent calls to ensure only one refresh request is in flight.
 */
export async function silentRefreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  // If a refresh is already underway, reuse the same promise to prevent competing requests
  if (isRefreshingPromise) {
    return isRefreshingPromise;
  }

  const currentRefreshToken = localStorage.getItem("refresh_token");
  if (!currentRefreshToken) {
    return null;
  }

  isRefreshingPromise = (async () => {
    try {
      const cleanApiUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
      const response = await fetch(`${cleanApiUrl}/api/auth/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: currentRefreshToken }),
      });

      if (!response.ok) {
        // Refresh token is expired or invalid — clear authentication credentials
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("username");
        return null;
      }

      const data = await response.json();
      if (data.access) {
        localStorage.setItem("access_token", data.access);
        if (data.refresh) {
          localStorage.setItem("refresh_token", data.refresh);
        }
        return data.access as string;
      }
      return null;
    } catch {
      return null;
    } finally {
      isRefreshingPromise = null;
    }
  })();

  return isRefreshingPromise;
}

/**
 * Authenticated fetch helper that automatically attaches JWT Bearer token
 * and silently retries once upon receiving 401 if a valid refresh_token exists.
 */
export async function authFetch(
  input: string,
  init?: RequestInit,
  isRetry = false
): Promise<Response> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const headers = new Headers(init?.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const cleanApiUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  const fullUrl = input.startsWith("http")
    ? input
    : `${cleanApiUrl}${input.startsWith("/") ? "" : "/"}${input}`;

  const response = await fetch(fullUrl, {
    ...init,
    headers,
  });

  // Handle 401 with silent token refresh and retry
  if (response.status === 401 && !isRetry && typeof window !== "undefined") {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      const newAccessToken = await silentRefreshToken();
      if (newAccessToken) {
        const retryHeaders = new Headers(init?.headers);
        retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);
        return authFetch(fullUrl, {
          ...init,
          headers: retryHeaders,
        }, true);
      }
    } else {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("username");
    }
  }

  return response;
}
