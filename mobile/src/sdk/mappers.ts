import {
  TaskStatus,
  TaskPriority,
  WeekStart,
  ThemeAppearance,
  TaskView,
  TaskSort,
  Language,
} from "./types";

export const getStatusLabel = (status?: TaskStatus | string): string => {
  switch (status) {
    case "todo":
      return "To Do";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return status ? status.replace("_", " ") : "To Do";
  }
};

export const getPriorityLabel = (priority?: TaskPriority | string): string => {
  switch (priority) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    default:
      return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : "Medium";
  }
};

export const getWeekStartLabel = (ws?: WeekStart | string): string => {
  switch (ws) {
    case "monday":
      return "Monday";
    case "sunday":
      return "Sunday";
    case "saturday":
      return "Saturday";
    default:
      return "Monday";
  }
};

export const getAppearanceLabel = (app?: ThemeAppearance | string): string => {
  switch (app) {
    case "system":
      return "System";
    case "light":
      return "Light";
    case "dark":
      return "Dark";
    default:
      return "System";
  }
};

export const getViewLabel = (view?: TaskView | string): string => {
  switch (view) {
    case "list":
      return "List View";
    case "board":
      return "Board View";
    default:
      return "List View";
  }
};

export const getSortLabel = (sort?: TaskSort | string): string => {
  switch (sort) {
    case "due_date":
      return "Due Date";
    case "priority":
      return "Priority";
    case "created_at":
      return "Created Date";
    case "title":
      return "Alphabetical";
    default:
      return "Due Date";
  }
};

export const getLanguageLabel = (lang?: Language | string): string => {
  switch (lang) {
    case "en":
      return "English";
    case "es":
      return "Spanish";
    case "fr":
      return "French";
    case "de":
      return "German";
    default:
      return "English";
  }
};
