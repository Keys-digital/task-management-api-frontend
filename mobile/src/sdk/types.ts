/**
 * TaskFlo Mobile SDK Type Definitions
 * Aligned 1:1 with Django REST Framework backend models & serializers
 */

export interface AuthTokens {
  access: string;
  refresh: string;
}

export type ThemeAppearance = "system" | "light" | "dark";
export type DateFormat = "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";
export type TimeFormat = "12h" | "24h";
export type WeekStart = "monday" | "sunday" | "saturday";
export type Language = "en" | "es" | "fr" | "de";

export type TaskStatus = "todo" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type TaskView = "list" | "board";
export type TaskSort = "due_date" | "priority" | "created_at" | "title";

export interface NotificationPreferences {
  due_date: boolean;
  overdue: boolean;
  project_activity: boolean;
  email_digest: boolean;
  in_app: boolean;
}

export interface UserPreferences {
  appearance: ThemeAppearance;
  timezone: string;
  language: Language | string;
  date_format: DateFormat;
  time_format: TimeFormat;
  week_start: WeekStart;
  default_task_priority: TaskPriority;
  default_task_view: TaskView;
  default_task_sort: TaskSort;
  show_completed_tasks: boolean;
  notification_preferences?: NotificationPreferences;
  notify_due_date?: boolean;
  notify_overdue?: boolean;
  notify_project_activity?: boolean;
  notify_email_digest?: boolean;
  notify_in_app?: boolean;
}

export interface UserProfile extends UserPreferences {
  full_name: string | null;
  bio: string | null;
  avatar: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  profile: UserProfile;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
}

export interface Task {
  id: number;
  project: number | null;
  project_name?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskPayload {
  title: string;
  project?: number | null;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  project?: number | null;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export interface TaskFilterOptions {
  project?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

export interface ApiErrorDetail {
  [field: string]: string | string[] | Record<string, unknown>;
}

export interface ApiErrorResponse {
  detail?: string;
  code?: string;
  [key: string]: unknown;
}
