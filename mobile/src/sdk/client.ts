import { AuthTokens, ApiErrorResponse } from "./types";

export class TaskFloError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: ApiErrorResponse
  ) {
    super(message);
    this.name = "TaskFloError";
  }
}

export class AuthenticationError extends TaskFloError {
  constructor(message = "Authentication credentials were not provided or are invalid.", data?: ApiErrorResponse) {
    super(message, 401, data);
    this.name = "AuthenticationError";
  }
}

export class NetworkError extends TaskFloError {
  constructor(message = "Network error occurred while connecting to TaskFlo API.") {
    super(message, 0);
    this.name = "NetworkError";
  }
}

export class ValidationError extends TaskFloError {
  constructor(message: string, public errors: Record<string, unknown>, data?: ApiErrorResponse) {
    super(message, 400, data);
    this.name = "ValidationError";
  }
}

export interface ClientConfig {
  baseUrl?: string;
  getRefreshToken?: () => Promise<string | null>;
  onTokensRefreshed?: (tokens: AuthTokens) => Promise<void> | void;
  onSessionExpired?: () => Promise<void> | void;
}

export class TaskFloClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;

  public getRefreshToken?: () => Promise<string | null>;
  public onTokensRefreshed?: (tokens: AuthTokens) => Promise<void> | void;
  public onSessionExpired?: () => Promise<void> | void;

  constructor(config: ClientConfig = {}) {
    let resolvedUrl: string | undefined;

    // 1. Check Expo Constants extra if available
    try {
      // Dynamic check for expo-constants
      const Constants = require("expo-constants").default || require("expo-constants");
      if (Constants?.expoConfig?.extra?.TASKFLO_API_URL) {
        resolvedUrl = Constants.expoConfig.extra.TASKFLO_API_URL;
      }
    } catch {
      // expo-constants not present or outside Expo context
    }

    // 2. Check process.env.EXPO_PUBLIC_API_URL or standard env
    if (!resolvedUrl && typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) {
      resolvedUrl = process.env.EXPO_PUBLIC_API_URL;
    }

    const defaultUrl = resolvedUrl || "http://localhost:8000";
    
    this.baseUrl = (config.baseUrl || defaultUrl).replace(/\/+$/, "");
    this.getRefreshToken = config.getRefreshToken;
    this.onTokensRefreshed = config.onTokensRefreshed;
    this.onSessionExpired = config.onSessionExpired;
  }

  public setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, "");
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Atomic token refresh with mutex lock to prevent concurrent refresh races
   */
  public async refreshTokenFlow(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        if (!this.getRefreshToken) {
          throw new AuthenticationError("No refresh token getter provided.");
        }

        const refreshToken = await this.getRefreshToken();
        if (!refreshToken) {
          throw new AuthenticationError("No refresh token available.");
        }

        const res = await fetch(`${this.baseUrl}/api/auth/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!res.ok) {
          const errData = (await res.json().catch(() => ({}))) as ApiErrorResponse;
          throw new AuthenticationError("Refresh token expired or blacklisted.", errData);
        }

        const data = (await res.json()) as AuthTokens;
        this.setAccessToken(data.access);

        if (this.onTokensRefreshed) {
          await this.onTokensRefreshed(data);
        }

        return data.access;
      } catch (err) {
        this.setAccessToken(null);
        if (this.onSessionExpired) {
          await this.onSessionExpired();
        }
        throw err;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Universal fetch wrapper with authorization, error normalization, and safe 401 retry policy
   */
  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    if (this.accessToken) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401 && !isRetry && endpoint !== "/api/auth/login/" && endpoint !== "/api/auth/token/refresh/") {
        try {
          const newAccess = await this.refreshTokenFlow();
          if (newAccess) {
            // Safe retry policy: automatically retry GET operations
            const method = (options.method || "GET").toUpperCase();
            if (method === "GET") {
              return this.request<T>(endpoint, options, true);
            } else {
              // For mutations, verify if token was refreshed successfully before informing caller
              throw new AuthenticationError("Session refreshed. Please re-submit your action.", { detail: "Token refreshed" });
            }
          }
        } catch (refreshErr) {
          if (refreshErr instanceof TaskFloError) {
            throw refreshErr;
          }
          throw new AuthenticationError("Session expired. Please log in again.");
        }
      }

      if (response.status === 204) {
        return {} as T;
      }

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          throw new AuthenticationError(responseData?.detail || "Unauthorized", responseData);
        }
        if (response.status === 400) {
          throw new ValidationError("Validation error", responseData, responseData);
        }
        throw new TaskFloError(
          responseData?.detail || `HTTP ${response.status} Error`,
          response.status,
          responseData
        );
      }

      return responseData as T;
    } catch (error) {
      if (error instanceof TaskFloError) {
        throw error;
      }
      throw new NetworkError((error as Error)?.message || "Failed to fetch from TaskFlo API");
    }
  }
}
