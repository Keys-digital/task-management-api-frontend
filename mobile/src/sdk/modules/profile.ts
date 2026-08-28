import { TaskFloClient } from "../client";
import { User, UserProfile, UserPreferences } from "../types";

export class ProfileModule {
  constructor(private client: TaskFloClient) {}

  /**
   * Fetch current authenticated user & profile details
   */
  public async getMe(): Promise<User> {
    return this.client.request<User>("/api/auth/me/", {
      method: "GET",
    });
  }

  /**
   * Update profile details (full_name, bio, preferences)
   */
  public async updateMe(payload: Partial<Omit<User, "profile">> & { profile?: Partial<UserProfile> }): Promise<User> {
    return this.client.request<User>("/api/auth/me/", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Fetch user application preferences
   */
  public async getPreferences(): Promise<UserPreferences> {
    return this.client.request<UserPreferences>("/api/auth/preferences/", {
      method: "GET",
    });
  }

  /**
   * Update user application preferences
   */
  public async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    return this.client.request<UserPreferences>("/api/auth/preferences/", {
      method: "PATCH",
      body: JSON.stringify(preferences),
    });
  }

  /**
   * Export user account data
   */
  public async exportData(): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>("/api/auth/export-data/", {
      method: "GET",
    });
  }

  /**
   * Delete user account permanently
   */
  public async deleteAccount(): Promise<void> {
    await this.client.request<void>("/api/auth/me/", {
      method: "DELETE",
    });
  }
}
