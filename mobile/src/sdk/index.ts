import { TaskFloClient, ClientConfig } from "./client";
import { AuthModule } from "./modules/auth";
import { ProfileModule } from "./modules/profile";
import { ProjectsModule } from "./modules/projects";
import { TasksModule } from "./modules/tasks";

export * from "./types";
export * from "./client";
export * from "./modules/auth";
export * from "./modules/profile";
export * from "./modules/projects";
export * from "./modules/tasks";

export class TaskFloSDK {
  public client: TaskFloClient;
  public auth: AuthModule;
  public profile: ProfileModule;
  public projects: ProjectsModule;
  public tasks: TasksModule;

  constructor(config: ClientConfig = {}) {
    this.client = new TaskFloClient(config);
    this.auth = new AuthModule(this.client);
    this.profile = new ProfileModule(this.client);
    this.projects = new ProjectsModule(this.client);
    this.tasks = new TasksModule(this.client);
  }
}
