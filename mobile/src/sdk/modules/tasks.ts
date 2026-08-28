import { TaskFloClient } from "../client";
import { Task, CreateTaskPayload, UpdateTaskPayload, TaskFilterOptions } from "../types";

export class TasksModule {
  constructor(private client: TaskFloClient) {}

  /**
   * List tasks with optional project, status, priority, and search filtering
   */
  public async listTasks(filters: TaskFilterOptions = {}): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters.project !== undefined && filters.project !== null) {
      params.append("project", String(filters.project));
    }
    if (filters.status) params.append("status", filters.status);
    if (filters.priority) params.append("priority", filters.priority);
    if (filters.search) params.append("search", filters.search);

    const queryString = params.toString();
    const endpoint = `/api/projects/tasks/${queryString ? `?${queryString}` : ""}`;

    return this.client.request<Task[]>(endpoint, {
      method: "GET",
    });
  }

  /**
   * Get single task by ID
   */
  public async getTask(id: number): Promise<Task> {
    return this.client.request<Task>(`/api/projects/tasks/${id}/`, {
      method: "GET",
    });
  }

  /**
   * Create a task
   */
  public async createTask(payload: CreateTaskPayload): Promise<Task> {
    return this.client.request<Task>("/api/projects/tasks/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Update task details
   */
  public async updateTask(id: number, payload: UpdateTaskPayload): Promise<Task> {
    return this.client.request<Task>(`/api/projects/tasks/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Toggle task status between todo and completed
   */
  public async toggleTaskCompletion(task: Task): Promise<Task> {
    const newStatus = task.status === "completed" ? "todo" : "completed";
    return this.updateTask(task.id, { status: newStatus });
  }

  /**
   * Delete a task
   */
  public async deleteTask(id: number): Promise<void> {
    await this.client.request<void>(`/api/projects/tasks/${id}/`, {
      method: "DELETE",
    });
  }
}
