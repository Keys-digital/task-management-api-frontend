import { TaskFloClient } from "../client";
import { Project, CreateProjectPayload, UpdateProjectPayload } from "../types";

export class ProjectsModule {
  constructor(private client: TaskFloClient) {}

  /**
   * List all projects for the authenticated user
   */
  public async listProjects(): Promise<Project[]> {
    return this.client.request<Project[]>("/api/projects/", {
      method: "GET",
    });
  }

  /**
   * Get project details by ID
   */
  public async getProject(id: number): Promise<Project> {
    return this.client.request<Project>(`/api/projects/${id}/`, {
      method: "GET",
    });
  }

  /**
   * Create a new project
   */
  public async createProject(payload: CreateProjectPayload): Promise<Project> {
    return this.client.request<Project>("/api/projects/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Update an existing project
   */
  public async updateProject(id: number, payload: UpdateProjectPayload): Promise<Project> {
    return this.client.request<Project>(`/api/projects/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Delete a project
   */
  public async deleteProject(id: number): Promise<void> {
    await this.client.request<void>(`/api/projects/${id}/`, {
      method: "DELETE",
    });
  }
}
