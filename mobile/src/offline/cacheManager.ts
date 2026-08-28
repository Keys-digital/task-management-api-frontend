import { Task, Project } from "../sdk/types";
import { NetworkError, AuthenticationError } from "../sdk/client";

export type OfflineState =
  | "ONLINE"
  | "OFFLINE"
  | "SYNCING"
  | "SYNCED"
  | "SYNC_PARTIAL_FAILED"
  | "SYNC_FAILED"
  | "AUTH_REQUIRED";

export interface QueuedMutation {
  id: string; // Stable client-generated UUID/ID for idempotency tracking
  type: "CREATE_TASK" | "UPDATE_TASK" | "DELETE_TASK" | "CREATE_PROJECT";
  payload: unknown;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

/**
 * Mobile Offline Cache & Lifecycle Manager
 *
 * Conflict Strategy Documentation:
 * - Client-side mutation IDs guarantee idempotency across retries on the client.
 * - Server synchronization relies on Django backend `updated_at` timestamps for optimistic concurrency detection.
 * - Non-idempotent POST operations check token & network state before execution to avoid duplicate creation.
 */
export class OfflineCacheManager {
  private state: OfflineState = "ONLINE";
  private taskCache: Task[] = [];
  private projectCache: Project[] = [];
  private mutationQueue: QueuedMutation[] = [];
  private lastSyncTimestamp: number | null = Date.now();
  private currentUserId: number | null = null;

  constructor() {
    const online = typeof navigator !== "undefined" && typeof navigator.onLine === "boolean" ? navigator.onLine : true;
    this.state = online ? "ONLINE" : "OFFLINE";
  }

  // Lifecycle State Machine
  public getState(): OfflineState {
    return this.state;
  }

  public setState(newState: OfflineState): void {
    this.state = newState;
    if (newState === "SYNCED" || newState === "ONLINE") {
      this.lastSyncTimestamp = Date.now();
    }
  }

  public setOnlineStatus(isOnline: boolean): void {
    if (!isOnline) {
      this.setState("OFFLINE");
    } else if (this.state === "OFFLINE") {
      this.setState(this.mutationQueue.length > 0 ? "SYNCING" : "ONLINE");
    }
  }

  public getLastSyncTimestamp(): number | null {
    return this.lastSyncTimestamp;
  }

  public getFormattedStaleness(): string {
    if (!this.lastSyncTimestamp) return "Not synced yet";
    const elapsedMinutes = Math.floor((Date.now() - this.lastSyncTimestamp) / 60000);
    if (elapsedMinutes < 1) return "Last synced just now";
    if (elapsedMinutes === 1) return "Last synced 1 minute ago";
    return `Last synced ${elapsedMinutes} minutes ago`;
  }

  /**
   * Distinguish true network disconnects from auth/authorization errors and server errors
   */
  public classifyError(error: unknown): "NETWORK" | "AUTH" | "SERVER" {
    if (error instanceof NetworkError || (error && typeof error === "object" && "name" in error && error.name === "NetworkError")) {
      return "NETWORK";
    }
    if (error instanceof AuthenticationError || (error && typeof error === "object" && "name" in error && error.name === "AuthenticationError")) {
      return "AUTH";
    }
    return "SERVER";
  }

  public isNetworkFailure(error: unknown): boolean {
    return this.classifyError(error) === "NETWORK";
  }

  // User-Scoped Cache Isolation & Logout Purge
  public setCurrentUser(userId: number | null): void {
    if (this.currentUserId !== null && this.currentUserId !== userId) {
      this.clearUserSessionCache();
    }
    this.currentUserId = userId;
  }

  public clearUserSessionCache(): void {
    this.taskCache = [];
    this.projectCache = [];
    this.mutationQueue = [];
    this.lastSyncTimestamp = null;
    this.currentUserId = null;
    this.state = "ONLINE";
  }

  // Cache Operations
  public setTaskCache(tasks: Task[]): void {
    this.taskCache = [...tasks];
    this.lastSyncTimestamp = Date.now();
  }

  public getTaskCache(): Task[] {
    return [...this.taskCache];
  }

  public setProjectCache(projects: Project[]): void {
    this.projectCache = [...projects];
    this.lastSyncTimestamp = Date.now();
  }

  public getProjectCache(): Project[] {
    return [...this.projectCache];
  }

  // Offline Mutation Queueing
  public queueMutation(type: QueuedMutation["type"], payload: unknown): QueuedMutation {
    const item: QueuedMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };
    this.mutationQueue.push(item);
    this.setState("SYNC_PARTIAL_FAILED");
    return item;
  }

  public getMutationQueue(): QueuedMutation[] {
    return [...this.mutationQueue];
  }

  public clearMutationQueue(): void {
    this.mutationQueue = [];
  }

  public removeQueuedMutation(id: string): void {
    this.mutationQueue = this.mutationQueue.filter((m) => m.id !== id);
    if (this.mutationQueue.length === 0 && this.state !== "OFFLINE") {
      this.setState("SYNCED");
    }
  }

  public markMutationFailed(id: string, errorMessage: string): void {
    const mut = this.mutationQueue.find((m) => m.id === id);
    if (mut) {
      mut.retryCount++;
      mut.lastError = errorMessage;
    }
    this.setState("SYNC_FAILED");
  }
}

export const defaultOfflineCache = new OfflineCacheManager();
