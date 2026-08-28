import { TaskFloClient } from "../client";
import { AuthTokens, User } from "../types";

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
}

export interface ChangePasswordParams {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export class AuthModule {
  constructor(private client: TaskFloClient) {}

  /**
   * Log in user with username and password
   */
  public async login(params: LoginParams): Promise<AuthTokens> {
    const payload = {
      username: params.username,
      password: params.password,
    };

    const tokens = await this.client.request<AuthTokens>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    this.client.setAccessToken(tokens.access);
    return tokens;
  }

  /**
   * Register a new user account
   */
  public async register(params: RegisterParams): Promise<User> {
    return this.client.request<User>("/api/auth/register/", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Refresh JWT access token using refresh token
   */
  public async refreshToken(refreshToken: string): Promise<AuthTokens> {
    return this.client.request<AuthTokens>("/api/auth/token/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
    });
  }

  /**
   * Change account password
   */
  public async changePassword(params: ChangePasswordParams): Promise<{ message?: string }> {
    return this.client.request<{ message?: string }>("/api/auth/change-password/", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Logout user locally by clearing memory token
   */
  public logout(): void {
    this.client.setAccessToken(null);
  }
}
